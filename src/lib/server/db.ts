/**
 * db.ts — Turso (libSQL) データベース
 * products テーブルの CRUD を提供する薄いクエリ関数群
 * Vercel サーバーレス環境で動作する
 */

import { createClient, type Client } from '@libsql/client';
import { env } from '$env/dynamic/private';

let client: Client | undefined;

/** DB クライアントを取得（シングルトン、遅延初期化） */
function getClient(): Client {
	if (!client) {
		const url = env.TURSO_DATABASE_URL;
		const authToken = env.TURSO_AUTH_TOKEN;

		if (!url) {
			throw new Error('TURSO_DATABASE_URL is not set. Check your .env file.');
		}

		client = createClient({
			url,
			authToken
		});
	}
	return client;
}

/** テーブル初期化（初回アクセス時に呼ぶ） */
let initialized = false;
async function ensureTable(): Promise<void> {
	if (initialized) return;
	const db = getClient();
	await db.execute(`
		CREATE TABLE IF NOT EXISTS products (
			jan_code   TEXT PRIMARY KEY,
			raw_title  TEXT NOT NULL,
			name       TEXT NOT NULL,
			genre      TEXT NOT NULL DEFAULT '',
			price      INTEGER NOT NULL DEFAULT 0,
			source     TEXT NOT NULL DEFAULT 'yahoo',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		)
	`);
	initialized = true;
}

/** products テーブルの行型 */
export type Product = {
	jan_code: string;
	raw_title: string;
	name: string;
	genre: string;
	price: number;
	source: string;
	created_at: string;
	updated_at: string;
};

/** JAN コードで商品を検索 (キャッシュヒット) */
export async function findProduct(janCode: string): Promise<Product | undefined> {
	await ensureTable();
	const db = getClient();
	const result = await db.execute({
		sql: 'SELECT * FROM products WHERE jan_code = ?',
		args: [janCode]
	});

	if (result.rows.length === 0) return undefined;

	const row = result.rows[0];
	return {
		jan_code: row.jan_code as string,
		raw_title: row.raw_title as string,
		name: row.name as string,
		genre: row.genre as string,
		price: row.price as number,
		source: row.source as string,
		created_at: row.created_at as string,
		updated_at: row.updated_at as string
	};
}

/** 商品を保存（UPSERT） */
export async function upsertProduct(
	product: Omit<Product, 'created_at' | 'updated_at'>
): Promise<void> {
	await ensureTable();
	const db = getClient();
	await db.execute({
		sql: `
			INSERT INTO products (jan_code, raw_title, name, genre, price, source)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(jan_code) DO UPDATE SET
				raw_title  = excluded.raw_title,
				name       = excluded.name,
				genre      = excluded.genre,
				price      = excluded.price,
				source     = excluded.source,
				updated_at = datetime('now')
		`,
		args: [
			product.jan_code,
			product.raw_title,
			product.name,
			product.genre,
			product.price,
			product.source
		]
	});
}
