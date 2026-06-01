# regi-star 開発引き継ぎドキュメント

> このドキュメントは、別セッション（別モデル）で開発を継続するための引き継ぎ資料です。
> ここまでで決まった仕様・確定スタック・完了済み作業・次にやることを記録しています。
> 最終更新: Phase 0 着手途中（svelte.config.js を adapter-node に書き換えた直後）

---

## 1. アプリ概要

スーパーのレジ打ちごっこができる Web アプリ（PWA）。

ユーザー操作の流れ:

1. ブラウザでカメラを起動し、映っているバーコード（JAN コード）をスキャンする
2. スキャン成功時に「ピッ」という効果音を鳴らす
3. JAN コードをバックエンドへ送り、商品情報（簡単な商品名・ジャンル・値段）を取得する
4. 取得した商品名と値段を機械音声で読み上げる（例:「牛乳。350円です。」）
5. スマホにインストールして遊べる（PWA）

### コスト削減の肝
- Yahoo!商品検索 API のタイトルは長いので、安価な LLM で「簡単な商品名・ジャンル・値段」に整形する
- 毎回 LLM を呼ぶとコストがかかるため、**JAN コードごとに DB へキャッシュ保存**し、既知の JAN は即座に DB から返す（Yahoo も LLM も呼ばない）

---

## 2. 確定したアーキテクチャ・技術選定

### 構成方針: 「PWA（クライアント）＋ 薄いバックエンド」の 2 層
全部ブラウザ完結にはできない。理由:
- Yahoo!商品検索 API はブラウザ直叩きすると CORS で弾かれ、`appid`(Client ID) がソースに丸見えになる
- LLM の API キーをクライアントに置くと抜かれる
- キャッシュ DB はサーバー側に置かないとコスト削減の意味がない

→ バックエンドは **エンドポイント 1 本に責務を集約**（UNIX 哲学）:

```
GET /api/product/{jan}
  ① DB にあれば即返す（Yahoo も LLM も呼ばない）
  ② なければ Yahoo 検索 → LLM 整形 → DB 保存 → 返す
```

クライアントから見ると「JAN を投げたら商品情報が返るだけ」の単機能。

### 確定スタック（ユーザー選択済み）
- **バックエンド構成: オール SvelteKit**（`+server.ts` で API 完結・最小構成）。FastAPI は使わない。
- **LLM 方針: とにかく最安重視（Flash-Lite 系）**。具体的なモデル名は実装時（Phase 3）に最新を web 検索して当てる。

### 技術選定一覧
| 役割 | 採用 | 備考 |
|---|---|---|
| PWA 基盤 | SvelteKit (Svelte 5, runes mode) + `@vite-pwa/sveltekit` | フロントも API も 1 アプリ |
| アダプタ | `@sveltejs/adapter-node` | 自前ホスト / スマホ実機テスト向け |
| API | `src/routes/api/product/[jan]/+server.ts` の 1 本 | 責務集約 |
| スキャン | ブラウザ標準 `BarcodeDetector` を優先 + `@zxing/browser` フォールバック | 未対応端末向けに保険 |
| 効果音 | Web Audio API でビープ自前生成 | 音源ファイル不要・軽い |
| 読み上げ | Web Speech API (`SpeechSynthesis`, `ja-JP`) | 追加コストゼロ |
| DB | `better-sqlite3`（同期・軽量） | ORM は使わず薄いクエリ関数のみ（UNIX 哲学寄せ） |
| LLM | Gemini Flash-Lite 系 | キャッシュ効くので 2 回目以降タダ。モデル名は着手時に最新確認 |

### DB スキーマ案（products テーブル）
| カラム | 型 | 説明 |
|---|---|---|
| `jan_code` | TEXT PRIMARY KEY | JAN コード（キャッシュキー） |
| `raw_title` | TEXT | Yahoo の生タイトル |
| `name` | TEXT | LLM 整形後の簡単な商品名 |
| `genre` | TEXT | LLM 整形後の商品ジャンル |
| `price` | INTEGER | 値段 |
| `source` | TEXT | 取得元（例: yahoo） |
| `created_at` | TEXT/INTEGER | 作成日時 |
| `updated_at` | TEXT/INTEGER | 更新日時 |

---

## 3. リポジトリ / git 設定（確定）

- **独立リポジトリ（新規）**として作成する
- リモート: `git@github.com:tomoakari/regi-star.git`
- コミットユーザ: `tomoakari`
- 作業ディレクトリ: `/home/tomo/dev/regi-star`
- `/home/tomo/dev` 自体は git 管理外であることを確認済み（親方向にも .git なし）
- コミットメッセージには接頭辞をつける（fix / feat / update / refactor / test など）

### まだ実施していない git 操作（次セッションで実施）
- `git init`（まだ未実施）
- `git config user.name / user.email`（tomoakari として設定）
- リモート `origin` の追加
- 初回コミット

---

## 4. 環境情報（確認済み）

- 実行環境: WSL2 `/home/tomo/dev`
- Node.js: **v24.13.0**
- npm: **11.6.2**
- SvelteKit スキャフォールド CLI: `sv` (v0.15.x)
- ツール: serena（コードベース操作・編集の主力）、claude_code 優先、コマンドはパイプを使わず 1 つずつ実行

---

## 5. ここまでの完了作業（Phase 0 途中まで）

1. ✅ serena で `dev`（`/home/tomo/dev`）プロジェクトをアクティベート
2. ✅ `/home/tomo/dev` が git 管理外であることを確認
3. ✅ Node/npm バージョン確認
4. ✅ `sv create regi-star --template minimal --types ts --no-add-ons --no-install` で雛形生成
5. ✅ `npm install`（基本依存）
6. ✅ `npm install -D @sveltejs/adapter-node @vite-pwa/sveltekit`（アダプタ＆PWAプラグイン追加）
7. ✅ `svelte.config.js` を `adapter-auto` → `adapter-node` に書き換え済み

### 現在のファイル構成（node_modules / .svelte-kit / .git 除く）
```
regi-star/
├── package.json          # adapter-node, @vite-pwa/sveltekit を含む
├── package-lock.json
├── tsconfig.json
├── svelte.config.js      # ★adapter-node 化済み
├── vite.config.ts        # まだ sveltekit() のみ（PWA プラグイン未追加）
├── .gitignore
├── .npmrc
├── README.md
├── .vscode/extensions.json
├── static/robots.txt
└── src/
    ├── app.html
    ├── app.d.ts
    ├── lib/
    │   ├── index.ts
    │   └── assets/favicon.svg
    └── routes/
        ├── +layout.svelte
        └── +page.svelte
```

### 主要バージョン（package.json より）
- @sveltejs/kit ^2.57.0
- svelte ^5.55.2
- @sveltejs/adapter-node ^5.5.4
- @vite-pwa/sveltekit ^1.1.0
- vite ^8.0.7
- typescript ^6.0.2

> 注意: `@sveltejs/adapter-auto` がまだ devDependencies に残っている。adapter-node に切り替えたので、不要なら後で削除してよい（必須ではない）。

---

## 6. 次にやること（Phase 0 残り → Phase 6）

### Phase 0 残り（足場の仕上げ）
- [ ] `vite.config.ts` に `@vite-pwa/sveltekit` の `SvelteKitPWA` プラグインを追加（manifest 設定込み）
- [ ] `npm run dev` でカメラ映像をプレビュー表示できる最小ページを作る（まだスキャンはしない、getUserMedia で背面カメラ映像を `<video>` に流すだけ）
- [ ] `git init` → user 設定（tomoakari）→ origin 追加 → 初回コミット（接頭辞 `feat:` など）

### Phase 1: バーコード検出 + 効果音
- [ ] `BarcodeDetector` で JAN を検出（未対応なら `@zxing/browser` にフォールバック）。`npm i @zxing/browser` が必要
- [ ] 検出した生 JAN を画面表示
- [ ] Web Audio API で「ピッ」音を生成・再生
- [ ] 同一 JAN の連続検出をデバウンスで弾く

### Phase 2: バックエンド（Yahoo 連携 + SQLite キャッシュ）
- [ ] `npm i better-sqlite3`
- [ ] `products` テーブル作成（上記スキーマ）
- [ ] `src/routes/api/product/[jan]/+server.ts` を実装。DB ヒット時は即返す。ミス時は Yahoo!商品検索 API を JAN で叩く（この段階では LLM は素通しで raw_title をそのまま name に入れてよい）
- [ ] Yahoo の `appid`(Client ID) は環境変数（`.env`）で管理。`.env` は .gitignore 済みか確認
- [ ] ※Yahoo!デベロッパー登録と appid 取得は**ユーザー(tomoakari)本人作業**（アカウント系のため Claude は実施不可）

### Phase 3: LLM 整形
- [ ] 着手時に「Gemini Flash-Lite 系の最新の最安モデル名」を web 検索で確認して当てる
- [ ] Yahoo の raw_title を LLM に渡し、簡単な商品名 / ジャンル / 値段を JSON で返させて DB に保存
- [ ] LLM の API キーも環境変数管理

### Phase 4: 音声読み上げ
- [ ] Web Speech API (`SpeechSynthesis`, `ja-JP`) で「{商品名}。{値段}円です。」を読み上げ

### Phase 5: PWA 仕上げ
- [ ] アイコン・manifest 整備、インストール可能化、オフライン対応（Service Worker）

### Phase 6（おまけ）: レジごっこ演出
- [ ] 合計金額・カート・お会計演出

---

## 7. 実装上の注意（ハマりどころ）

- **HTTPS 必須**: カメラ・PWA・Speech 系は secure context 限定。`localhost` は OK だが、**スマホ実機テストは LAN 内 HTTPS か `cloudflared`/`ngrok` トンネルが必要**。
- **自動再生ポリシー**: モバイルは音声・効果音をユーザー操作起点でしか鳴らせない。最初の「スタート」タップで `AudioContext` を resume しておく。
- **Yahoo API のキー**: `appid` をソースに直書きしない。サーバー側（環境変数）のみ。
- **価格の意味**: Yahoo の販売価格であって「スーパーの値段」ではない。遊びなので OK（固定/ランダムにする選択肢もあり）。
- **Yahoo!商品検索 API**: JAN コードで GET すれば商品情報の JSON が返る（V3 系）。仕様は着手時に最新を確認すること。

---

## 8. 開発ルール（ユーザー設定の遵守事項）

- 開発ディレクトリは WSL の `/home/tomo/dev`
- 開発時は serena を利用する
- コマンド実行は claude_code を優先
- コマンドはパイプを使わず 1 つずつ実行
- 無理のない範囲で UNIX 哲学に基づいて設計
- ファイル編集前に GitHub リポジトリ管理下か確認し、管理下ならブランチを切るか必ず確認する
- コミットメッセージに接頭辞（fix/feat/update/refactor/test など）をつける
