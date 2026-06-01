# regi-star Project Overview

## 目的
regi-star は SvelteKit (Svelte 5) + TypeScript で構築されたフロントエンドアプリケーション。
PWA対応 (@vite-pwa/sveltekit) あり。
adapter-node を使用しており、自前ホスト・スマホ実機テスト（LAN内HTTPS/トンネル）向けに設計されている。

## テックスタック
- **フレームワーク**: SvelteKit ^2.57.0
- **UIライブラリ**: Svelte 5 ^5.55.2（Runes モード強制）
- **言語**: TypeScript ^6.0.2
- **ビルドツール**: Vite ^8.0.7
- **アダプター**: @sveltejs/adapter-node（自前ホスト向け）
- **PWA**: @vite-pwa/sveltekit ^1.1.0

## プロジェクト構造
```
regi-star/
├── src/
│   ├── app.html          # HTMLシェル
│   ├── app.d.ts          # 型定義
│   ├── lib/
│   │   ├── index.ts      # ライブラリエントリ
│   │   └── assets/       # 静的アセット
│   └── routes/           # SvelteKit ルーティング
│       ├── +layout.svelte
│       └── +page.svelte
├── static/               # 静的ファイル
├── docs/                 # ドキュメント
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## 重要な設定
- Svelte 5 Runes モードを node_modules 以外の全ファイルに強制
- adapter-node でセルフホスト前提
