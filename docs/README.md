# Bluff Auction

嘘とハッタリで金を稼ぐ、ブラウザ対応4人対戦カードオークションゲーム

## ドキュメント

- [rule.md](./rule.md): ゲームルール仕様
- [idea.md](./idea.md): 初期アイデア
- [design.md](./design.md): システム設計

## 技術スタック

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Socket.IO + TypeScript
- 永続化: PostgreSQL(Drizzle ORM)
- Monorepo: npm workspaces
- 配布: Docker + docker-compose

## ディレクトリ構成

```
packages/
  shared/   # 型・定数・純粋ロジック
  server/   # Socket.IO サーバー + DB 永続化
  client/   # React クライアント
docker-compose.yml
```

## 初回セットアップ

```bash
cp .env-template .env
```

ポート・DB 認証情報を変更したい場合は `.env` を編集。`.env` は `.gitignore` 対象。

## 起動(Docker、推奨)

```bash
docker compose up --build
```

- クライアント: `http://localhost:${CLIENT_PORT}`(既定 8080)
- サーバー: `http://localhost:${SERVER_PORT}`(既定 4000)
- Postgres: localhost:5432(認証情報は `.env` 参照)
- マイグレーションはサーバー起動時に自動適用

停止・再起動:

```bash
docker compose down            # コンテナ停止(DB データは保持)
docker compose down -v         # DB ボリュームごと削除(完全リセット)
docker compose restart server  # サーバーのみ再起動(状態永続化の確認)
```

## 開発(ローカル、Docker なし)

Postgres をローカル起動してから:

```bash
# 依存インストール
npm install

# DB 接続設定(.env の値を読み込む)
# 注意: .env の DATABASE_URL はデフォルトで Docker 内部名 `postgres` を指すため
# ローカル実行時は `localhost` に書き換え
set -a; source .env; set +a

# サーバー起動(別ターミナル、起動時にマイグレーション適用)
npm run dev:server

# クライアント起動(別ターミナル)
npm run dev:client
```

### マイグレーション

スキーマ変更時は `packages/server/src/db/schema.ts` を編集してから:

```bash
npm run db:generate --workspace=@bluff-auction/server  # マイグレーション生成
# 次回サーバー起動時に自動適用(手動適用する場合は db:migrate)
```

### コード品質

```bash
# 型チェック
npm run typecheck

# リント(oxlint)
npm run lint
npm run lint:fix

# フォーマット(oxfmt)
npm run format
npm run format:check
```

## プレイ方法

- 4人のプレイヤーでローカル動作
- 各自が別タブ/別ブラウザでアクセス
  - Docker 経由: `http://localhost:8080`
  - ローカル開発: `http://localhost:5173`
- ロビーで名前を入力 → 4人揃ったらゲーム開始
