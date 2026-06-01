/**
 * yahoo.ts — Yahoo!商品検索 API v3 クライアント
 * JAN コードで商品を検索し、タイトルと価格を返す
 */

import { env } from '$env/dynamic/private';

const YAHOO_API_URL = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';

export type YahooProduct = {
	title: string;
	price: number;
};

/**
 * JAN コードで Yahoo!ショッピングの商品を検索する
 * @returns 最初にヒットした商品、なければ undefined
 */
export async function searchByJan(janCode: string): Promise<YahooProduct | undefined> {
	const appId = env.YAHOO_APP_ID;
	if (!appId) {
		throw new Error('YAHOO_APP_ID is not set. Check your .env file.');
	}

	const params = new URLSearchParams({
		appid: appId,
		jan_code: janCode,
		results: '1'
	});

	const res = await fetch(`${YAHOO_API_URL}?${params}`);

	if (!res.ok) {
		throw new Error(`Yahoo API error: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();
	const hits = data?.hits;

	if (!hits || hits.length === 0) {
		return undefined;
	}

	const hit = hits[0];
	return {
		title: hit.name ?? '',
		price: hit.price ?? 0
	};
}
