/**
 * db.ts — SQLite データベース (better-sqlite3)
 * products テーブルの CRUD を提供する薄いクエリ関数群
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'regi-star.db');

let db: Database.Database | undefined;

/** DB 接続を取得（シングルトン、遅延初期化） */
function getDb(): Database.Database {
	if (!db) {
		// data ディレクトリがなければ作成
		const { mkdirSync } = require('fs');
		mkdirSync(join(process.cwd(), 'data'), { recursive: true });

		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		initTables(db);
	}
	return db;
}

/** テーブル初期化 */
function initTables(db: Database.Database): void {
	db.exec(`
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
export function findProduct(janCode: string): Product | undefined {
	const stmt = getDb().prepare('SELECT * FROM products WHERE jan_code = ?');
	return stmt.get(janCode) as Product | undefined;
}

/** 商品を保存（UPSERT） */
export function upsertProduct(product: Omit<Product, 'created_at' | 'updated_at'>): void {
	const stmt = getDb().prepare(`
		INSERT INTO products (jan_code, raw_title, name, genre, price, source)
		VALUES (@jan_code, @raw_title, @name, @genre, @price, @source)
		ON CONFLICT(jan_code) DO UPDATE SET
			raw_title  = excluded.raw_title,
			name       = excluded.name,
			genre      = excluded.genre,
			price      = excluded.price,
			source     = excluded.source,
			updated_at = datetime('now')
	`);
	stmt.run(product);
}
