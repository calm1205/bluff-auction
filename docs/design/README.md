# システム設計

ルール仕様は [../rule.md](../rule.md) を正とし、本ディレクトリは実装のための技術設計。

## 構成

- [01_sequence.md](./01_sequence.md) — 1ターンのシーケンス・接続ライフサイクル
- [02_data_model.md](./02_data_model.md) — ER図・視点別ビュー・永続化スキーマ
- [03_state_flow.md](./03_state_flow.md) — フェーズ遷移・主要ロジック(初期化/出品/入札/流札/取引)・勝利判定
- [04_api.md](./04_api.md) — Socket.IO・REST API・ユーザー管理
- [05_frontend.md](./05_frontend.md) — UI 設計・コンポーネント階層・状態管理
- [06_authentication.md](./06_authentication.md) — プレイヤー認証フロー(識別子生成・REST/Socket.IO 連携・整合性チェック)

## 概要

- 4人対戦のオンラインカード競売ゲームのローカル動作プロトタイプ
- Server-authoritative: 状態はサーバー保持、クライアントは視点フィルタ済みのビューのみ受信
- 秘匿情報(ブランド/カード種別/手札)はサーバー側で除去
- **ルームはユーザーが手動で作成**: 主催者がルーム作成、サーバーが UUID(ハイフンなし 32 文字)を発行 → 参加者はその UUID を貼り付けて合流
- **1ルーム = 1ゲーム**: ENDED は終端、再戦は新ルーム作成で行う(新しい UUID)

## 技術スタック

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Fastify + Socket.IO + TypeScript
  - ルーム管理(参加/離脱/開始): REST
  - ゲーム進行(出品/入札/パス): Socket.IO
- **共有コード**: npm workspaces で型・定数・純粋ロジックを共有
- **永続化**: PostgreSQL(Drizzle ORM、サーバー起動時に自動マイグレーション)
- **実行環境**: docker-compose(postgres / server / client の3サービス)

## プロジェクト構造

```
bluff-auction/
├── packages/
│   ├── shared/   # 型・イベント定義・純粋ロジック
│   ├── server/   # Fastify + Socket.IO サーバー + DB 永続化
│   └── client/   # React クライアント
├── docker-compose.yml
└── docs/
```

## 実装順序

1. monorepo 初期化(npm workspaces, TypeScript)
2. `shared`: 型・定数・勝利判定
3. `server`: Socket.IO 起動、roomManager、gameEngine、viewFilter
4. サーバー単体テスト(ゲーム1周をプログラムで検証)
5. `client`: Vite 初期化、Socket 接続、ロビー画面
6. ゲーム画面 UI 実装(出品・入札・傍観の3モード)
7. 4タブでローカル対戦動作確認
8. エッジケース調整(流札・フェイク上限・勝利判定)

## 非対応(プロトタイプ範囲外)

- 本格認証(ログイン、JWT、パスワード)
- 自動マッチメイキング(ルーム選択・作成はユーザーが手動で行う)
- 切断タイムアウトによる強制離脱
- 出品者オフライン時の自動パス・ターンスキップ(再接続待ちで進行停止)
- Redis Socket.IO adapter による水平スケール
- 本番デプロイ用マニフェスト、TLS、CI/CD
- モバイル最適化UI
- AI 対戦プレイヤー
- 入札の時系列履歴保持(現在の最高入札・パス済者のみ保持)
