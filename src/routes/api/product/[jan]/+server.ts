/**
 * GET /api/product/[jan]
 * JAN コードから商品情報を返す単機能エンドポイント
 * ① DB にあれば即返す（Yahoo も LLM も呼ばない）
 * ② なければ Yahoo 検索 → LLM 整形 → DB 保存 → 返す
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProduct, upsertProduct } from '$lib/server/db';
import { searchByJan } from '$lib/server/yahoo';
import { formatProduct } from '$lib/server/llm';

/** JAN コードの簡易バリデーション (8桁 or 13桁の数字) */
function isValidJan(jan: string): boolean {
	return /^\d{8}$|^\d{13}$/.test(jan);
}

export const GET: RequestHandler = async ({ params }) => {
	const { jan } = params;

	if (!isValidJan(jan)) {
		throw error(400, 'Invalid JAN code. Must be 8 or 13 digits.');
	}

	// ① キャッシュヒット
	const cached = await findProduct(jan);
	if (cached) {
		return json({
			jan_code: cached.jan_code,
			name: cached.name,
			genre: cached.genre,
			price: cached.price,
			source: cached.source,
			cache: true
		});
	}

	// ② Yahoo 検索
	const yahoo = await searchByJan(jan);
	if (!yahoo) {
		throw error(404, `Product not found for JAN: ${jan}`);
	}

	// ③ LLM で整形（失敗時は raw 値をフォールバック）
	let name = yahoo.title;
	let genre = '';
	let price = yahoo.price;

	try {
		const formatted = await formatProduct(yahoo.title, yahoo.price);
		name = formatted.name;
		genre = formatted.genre;
		price = formatted.price;
	} catch (err) {
		console.error('LLM formatting failed, using raw values:', err);
	}

	const product = {
		jan_code: jan,
		raw_title: yahoo.title,
		name,
		genre,
		price,
		source: 'yahoo'
	};

	await upsertProduct(product);

	return json({
		jan_code: product.jan_code,
		name: product.name,
		genre: product.genre,
		price: product.price,
		source: product.source,
		cache: false
	});
};
