/**
 * llm.ts — Gemini Flash-Lite で Yahoo の長いタイトルを
 * 「簡単な商品名 / ジャンル / 値段」に整形する
 *
 * モデル: gemini-2.5-flash-lite (最安)
 */

import { env } from '$env/dynamic/private';

const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export type FormattedProduct = {
	name: string;
	genre: string;
	price: number;
};

const SYSTEM_PROMPT = `あなたはスーパーマーケットの商品名を整理するアシスタントです。
与えられたYahoo!ショッピングの商品タイトルから、以下の3つを抽出してください。

1. name: スーパーのレジで読み上げるような短い商品名（例:「牛乳」「食パン」「ポテトチップス うすしお味」）
   - ブランド名・容量・送料表記・ショップ名などは削除
   - 日本語で、子供にもわかる簡潔な名前にする
2. genre: 商品ジャンル（例:「飲料」「パン」「お菓子」「調味料」「日用品」）
3. price: 価格（数値のみ、元のタイトルや提供された価格から判断）

必ず以下のJSON形式のみで回答してください。それ以外のテキストは出力しないでください。
{"name":"商品名","genre":"ジャンル","price":数値}`;

/**
 * Yahoo の raw_title と price を LLM で整形する
 */
export async function formatProduct(
	rawTitle: string,
	rawPrice: number
): Promise<FormattedProduct> {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not set. Check your .env file.');
	}

	const userPrompt = `商品タイトル: ${rawTitle}\n価格: ${rawPrice}円`;

	const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			system_instruction: {
				parts: [{ text: SYSTEM_PROMPT }]
			},
			contents: [
				{
					role: 'user',
					parts: [{ text: userPrompt }]
				}
			],
			generationConfig: {
				temperature: 0.1,
				maxOutputTokens: 200
			}
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Gemini API error: ${res.status} ${errText}`);
	}

	const data = await res.json();
	const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

	return parseResponse(text, rawTitle, rawPrice);
}

/** LLM レスポンスの JSON をパースする（フォールバック付き） */
function parseResponse(text: string, rawTitle: string, rawPrice: number): FormattedProduct {
	try {
		// ```json ... ``` のフェンスを除去
		const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
		const parsed = JSON.parse(cleaned);

		return {
			name: typeof parsed.name === 'string' ? parsed.name : rawTitle,
			genre: typeof parsed.genre === 'string' ? parsed.genre : '',
			price: typeof parsed.price === 'number' ? parsed.price : rawPrice
		};
	} catch {
		// パース失敗時は raw 値をそのまま返す
		return { name: rawTitle, genre: '', price: rawPrice };
	}
}
