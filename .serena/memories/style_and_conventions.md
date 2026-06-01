# regi-star コードスタイル・規約

## 言語・フレームワーク
- TypeScript 必須（厳格モード）
- Svelte 5 Runes モード強制（`$state`, `$derived`, `$effect` など）
- `<script lang="ts">` を使用

## Svelte 5 Runes
- リアクティブ変数: `let count = $state(0)`
- 派生値: `let doubled = $derived(count * 2)`
- 副作用: `$effect(() => { ... })`
- コンポーネントProps: `let { name } = $props()`
- 旧来の `export let` / `$:` 構文は使用しない

## ファイル命名
- ルートファイル: SvelteKit規約（`+page.svelte`, `+layout.svelte` など）
- コンポーネント: PascalCase（例: `MyComponent.svelte`）
- ユーティリティ: camelCase（例: `myUtil.ts`）

## タスク完了時
1. `npm run check` で型エラーがないか確認
2. `npm run build` でビルドエラーがないか確認
3. git commit (接頭辞付き: fix/feat/update/refactor/test など)
