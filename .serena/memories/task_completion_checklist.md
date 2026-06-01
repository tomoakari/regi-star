# タスク完了時のチェックリスト

## 必須確認事項
1. **型チェック**: `npm run check` を実行してエラーがないか確認
2. **ビルド確認**: `npm run build` でビルドエラーがないか確認
3. **動作確認**: `npm run dev` で実際に動作するか確認（必要に応じて）

## Git ワークフロー
1. 変更内容を確認: `git status` / `git diff`
2. ブランチ作成（機能追加・バグ修正など）: `git checkout -b feat/xxx`
3. ステージング: `git add -A` または個別ファイル
4. コミット（接頭辞必須）:
   - `fix:` バグ修正
   - `feat:` 新機能
   - `update:` 既存機能の更新
   - `refactor:` リファクタリング
   - `test:` テスト追加・修正
   - `docs:` ドキュメント
   - `chore:` その他
5. プッシュ: `git push`

## 注意事項
- Svelte 5 Runes モードが有効なので旧構文は使わない
- adapter-node 前提なので Node.js 環境でのみ動作
