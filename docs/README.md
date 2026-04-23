# Bluff Auction

嘘とハッタリで金を稼ぐ、ブラウザ対応4人対戦カードオークションゲーム

## ドキュメント

- [rule.md](./rule.md): ゲームルール仕様
- [design/](./design/): システム設計(分割ドキュメント)

## 技術スタック

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Fastify + Socket.IO + TypeScript
  - ルーム管理(参加/離脱/開始): REST
  - ゲーム進行(出品/入札/パス): Socket.IO
- API ドキュメント: OpenAPI + Swagger UI(`http://localhost:4000/docs`)
- 永続化: PostgreSQL(Drizzle ORM)
- Monorepo: npm workspaces
- 配布: Docker + docker-compose


## 初回セットアップ

```bash
cp .env-template .env
```

ポート・DB 認証情報を変更したい場合は `.env` を編集。`.env` は `.gitignore` 対象。

## 起動(Docker watch モード、推奨)

```bash
docker compose watch
```

- 初回は build → 起動 → ソース変更監視まで自動
- ソース編集で自動反映
  - `packages/server/src` 変更: コンテナへ sync → tsx watch が再起動
  - `packages/client/src` 変更: コンテナへ sync → Vite HMR
  - `package.json` / `package-lock.json` 変更: イメージを rebuild
- クライアント: `http://localhost:${CLIENT_PORT}`(既定 5173)
- サーバー: `http://localhost:${SERVER_PORT}`(既定 4000)
- Postgres: localhost:5432(認証情報は `.env` 参照)
- マイグレーションはサーバー起動時に自動適用

停止・再起動:

```bash
docker compose down            # コンテナ停止(DB データは保持)
docker compose down -v         # DB ボリュームごと削除(完全リセット)
docker compose restart server  # サーバーのみ再起動(状態永続化の確認)
```

### マイグレーション

スキーマ変更時は `packages/server/src/db/schema.ts` を編集してから:

```bash
npm run db:generate --workspace=@bluff-auction/server  # マイグレーション生成
# 次回サーバー起動時に自動適用(手動適用する場合は db:migrate)
```