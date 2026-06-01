/**
 * GET /api/product/[jan]
 * JAN コードから商品情報を返す単機能エンドポイント
 * ① DB にあれば即返す（Yahoo も LLM も呼ばない）
 * ② なければ Yahoo 検索 → DB 保存 → 返す
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProduct, upsertProduct } from '$lib/server/db';
import { searchByJan } from '$lib/server/yahoo';

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
	const cached = findProduct(jan);
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

	// Phase 3 で LLM 整形を入れるまでは raw_title をそのまま name に入れる
	const product = {
		jan_code: jan,
		raw_title: yahoo.title,
		name: yahoo.title,
		genre: '',
		price: yahoo.price,
		source: 'yahoo'
	};

	upsertProduct(product);

	return json({
		jan_code: product.jan_code,
		name: product.name,
		genre: product.genre,
		price: product.price,
		source: product.source,
		cache: false
	});
};
