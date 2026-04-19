---
name: ox
description: oxfmt でフォーマット + oxlint --fix を一括実行
disable-model-invocation: true
---

# 役割
コード整形と静的解析の一括実行

# コマンド
`make ox`

# 挙動
- `npm run format`(oxfmt)でフォーマット
- `npm run lint:fix`(oxlint --fix)で自動修正可能な lint を適用
- 残存 warning / error は結果として表示、修正は別途

# 自動実行
- `.claude/settings.json` の PostToolUse / Write|Edit フックにより、コード修正のたびに自動実行
- 明示呼び出しは不要、失敗時は Claude の出力にエラー表示

# 前提
- `Makefile` にターゲット `ox` が定義済み
- 依存が `npm install` 済み
