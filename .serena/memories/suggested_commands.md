# regi-star 開発コマンド集

## 開発サーバー起動
```bash
cd /home/tomo/dev/regi-star
npm run dev
# ブラウザ自動オープン付き
npm run dev -- --open
```

## ビルド
```bash
npm run build
```

## プレビュー（本番ビルド確認）
```bash
npm run preview
```

## 型チェック
```bash
npm run check
# ウォッチモード
npm run check:watch
```

## 依存関係インストール
```bash
npm install
```

## SvelteKit 同期（型生成）
```bash
npx svelte-kit sync
```

## Git操作
```bash
git status
git add -A
git commit -m "feat: ..."
git push
```
