# 02. データモデル

## 永続化スキーマ

Drizzle ORM で定義(`packages/server/src/db/schema.ts`)。FK は `rooms.id` へ `onDelete: cascade`。

```mermaid
erDiagram
    players ||--o{ room_players : "登録 → 所属"
    rooms ||--o{ room_players : has
    rooms ||--o{ cards : has
    rooms ||--o| auctions : "0..1"
    rooms ||--o{ auction_actions : "進行中の競りの履歴"
    cards ||--o| auctions : "出品中カード"
    room_players ||--o{ auctions : "seller(論理FK)"
    room_players ||--o{ auction_actions : "actor(論理FK)"

    rooms {
        text id PK "UUID(ハイフンなし 32 文字 hex)"
        text passphrase UK "合言葉(4文字、後述)"
        text phase
        integer turn_index "turn_order の現在位置"
        text_array turn_order "時計回りのPlayerId順"
        text host_player_id "nullable (FK players.id 論理参照)"
        text winner_id "nullable"
        timestamptz updated_at
    }
    players {
        text id PK "PlayerId (UUID, ハイフンなし 32 文字 hex)"
        text name
        timestamptz created_at
    }
    room_players {
        text room_id PK "FK rooms.id"
        text player_id PK "FK players.id"
        text brand "nullable"
        integer cash
        integer fakes_used
        boolean passed
        boolean online
        integer seat_index
    }
    cards {
        text id PK
        text room_id FK
        text brand
        text holder_id "nullable"
        text location "hand|auction"
    }
    auctions {
        text room_id PK "FK rooms.id"
        text seller_id
        text card_id FK
        text declared_brand
        integer starting_bid
        integer current_bid
        text highest_bidder_id "nullable"
        text_array passed_player_ids
    }
    auction_actions {
        text room_id PK "FK rooms.id"
        integer seq PK "ルーム内の発生順"
        text player_id "FK players.id 論理参照"
        text action_type "bid|pass"
        integer amount "nullable (action_type=bid のときのみ)"
        timestamptz created_at
    }
```

補足:

- `rooms.id` は UUID(ハイフンなし 32 文字 hex)、`rooms.passphrase` がユーザー向け **合言葉**(4 文字、unique)
  - 全 FK(`room_players.room_id` 等)は `rooms.id`(UUID)を参照
  - クライアントは合言葉のみ知り、URL / Socket.IO の `auth.roomId` も合言葉。サーバーが内部で UUID に解決
  - 合言葉の詳細仕様は下記「合言葉(rooms.passphrase)」
- `rooms.host_player_id` はルーム主催者(host)を識別。最初にルーム参加した player を設定し、以降不変。「ゲーム開始」操作の権限判定に使用(詳細は [04_api.md](./04_api.md))
- `players` は身元マスター(id PK / name / created_at)。プレイヤー登録(`POST /players`)で行を作成
- `room_players` はルーム所属 + ルーム単位のゲーム状態。`(room_id, player_id)` 複合PK、`player_id` は `players.id` への FK(`onDelete: cascade`)。host / guest の区別は `rooms.host_player_id` で表現するため列を持たない
- `players.id` はクライアント生成 UUID(localStorage 保持)= `PlayerId`。**形式はハイフンなし 32 文字 hex(小文字)で統一**(下記「UUID 形式」参照)
- `auctions` は `room_id` が PK のため1ルーム同時1件
- `auction_actions` は進行中の競りの**時系列履歴**(bid と pass)を保持。`(room_id, seq)` 複合PK、`seq` はルーム内 1 始まりの連番(アプリ側採番)
  - `action_type = bid` → `amount` 必須
  - `action_type = pass` → `amount` は NULL
  - `auctions` 行が削除(落札 / 流札時)されると CASCADE で履歴も消える → 次オークションは空状態から開始
- `cards.holder_id` / `auctions.seller_id` / `highest_bidder_id` / `auction_actions.player_id` は論理上 `room_players.player_id` 参照だが DB FK は未張り(アプリ側整合性)

## 合言葉(rooms.id)

ルームを一意に特定する人間入力用の文字列。`rooms.id` の値そのものとして格納する(別カラムは持たない)。

- **長さ**: 4 文字
- **文字種**: 大文字英字 + 数字、ただし混同しやすい `0` `O` `1` `I` `L` を除外 → 30 種
  - 採用文字集合: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
- **衝突空間**: 30^4 = 810,000(プロトタイプ用途に十分)
- **生成**: サーバーがランダム生成し、`rooms.id` で重複チェック。衝突したら再生成(最大 N 回)
- **正規化**: クライアント入力は大文字小文字を区別しない。サーバーで uppercase に正規化してから DB 照合
- **ライフタイム**: ENDED ルームのレコードは削除しない方針のため、合言葉は再利用しない
- **デフォルト値**: 旧スキーマで `rooms.id` に `default('default')` が残っているが新ルームは合言葉で上書きされ、デフォルト値は実質未使用

## UUID 形式

このシステムで扱う UUID は**ハイフンなし 32 文字の 16 進文字列(小文字)**で統一する。

- 例: `9f3c2a1b8d4e4a3f9b2c8d6e7f1a3b4c`(標準 v4 表記からハイフンを除去したもの)
- 用途: `players.id` (= `PlayerId`、localStorage `bluff-auction.playerId` の値)
- ルームの `rooms.id` は別仕様(4 文字合言葉、上記参照)、カードの `cards.id` は構造化文字列(`${brand}-${index}-${k}` を room スコープで namespace 化)で UUID ではない
- 生成は `shared/uuid.ts` の `generateUuid()` をクライアント・サーバー両方で利用

## 列挙値(`shared/types.ts`)

テーブルは `text` で保持、列挙値はアプリ側で定義。

- `Brand`: `painting` | `sculpture` | `pottery` | `jewelry`
- `Phase`: `lobby` | `listing` | `bidding` | `transaction` | `ended`
- `cards.location`: `hand` | `auction`

## 視点別ビュー

サーバーが `GameState`(= DBから再構築したメモリ状態)を視点別にフィルタして配信。
秘匿情報を除去してから各クライアントへ届ける。

```ts
type PublicPlayerView = {
  id, name,
  cash, fakesUsed,
  handCount,  // 枚数のみ(内容は非公開)
  passed, online,
};

type SelfPlayerView = PublicPlayerView & {
  brand: Brand,
  hand: Card[],
};

type AuctionActionView = {
  playerId: PlayerId;
  type: "bid" | "pass";
  amount: number | null;  // type='bid' のみ
};

type PublicAuctionView = {
  sellerId, declaredBrand,
  startingBid, currentBid,
  highestBidderId,
  passedPlayerIds,
  actionHistory: AuctionActionView[];  // 進行中オークションの時系列、seq 昇順
  // 実カード(card)は落札者確定まで非公開
};

type GameView = {
  phase, turnIndex, turnOrder, winnerId,
  hostPlayerId: PlayerId | null,  // ルーム主催者(初参加者で確定、UI のホスト判定に使用)
  self: SelfPlayerView | null,    // 観戦モード時は null
  others: PublicPlayerView[],
  currentAuction: PublicAuctionView | null,
};
```

## 隠蔽情報一覧

| 情報        | 公開  | 本人のみ    | 落札者のみ    |
| --------- | --- | ------- | -------- |
| プレイヤー名    | ○   |         |          |
| 所持金       | ○   |         |          |
| フェイク使用回数  |     | ○       |          |
| 手札枚数      | ○   |         |          |
| 自分のブランド   |     | ○       |          |
| 自分の手札内容   |     | ○       |          |
| 他人のブランド   |     | ✕(推理のみ) |          |
| 現在の競りの実種別 |     |         | ○(落札確定後) |
| 宣言種別      | ○   |         |          |
| 現在の最高入札額・入札者・パス済者 | ○ | | |
| 入札の時系列履歴(`actionHistory`) | ○(進行中オークション中のみ)  |         |          |
| ホスト(`hostPlayerId`) | ○   |         |          |

※ 入札履歴は**進行中オークション内**のみ保持。落札 / 流札で `auctions` 行と共に削除される。

## マイグレーション

- `packages/server/drizzle/` に SQL 配置
- サーバー起動時 `runMigrations()` が自動適用
- スキーマ変更は `npm run db:generate` で新マイグレーション生成
