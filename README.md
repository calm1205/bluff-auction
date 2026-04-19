# Bluff Auction

嘘とハッタリで金を稼ぐ、ブラウザ対応4人対戦カードオークションゲーム

## ドキュメント

- [rule.md](./rule.md): ゲームルール仕様
- [idea.md](./idea.md): 初期アイデア
- [design.md](./design.md): システム設計

## 技術スタック

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Socket.IO + TypeScript
- Monorepo: npm workspaces

## ディレクトリ構成

```
packages/
  shared/   # 型・定数・純粋ロジック
  server/   # Socket.IO サーバー
  client/   # React クライアント
```

## 開発

```bash
# 依存インストール
npm install

# サーバー起動(別ターミナル)
npm run dev --workspace=server

# クライアント起動(別ターミナル)
npm run dev --workspace=client
```

## プレイ方法

- 4人のプレイヤーでローカル動作
- 各自が別タブ/別ブラウザで `http://localhost:5173` にアクセス
- ロビーで名前を入力 → 4人揃ったらゲーム開始
