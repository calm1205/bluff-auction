# 04. 通信プロトコル

- **Socket.IO(双方向)**: ゲーム進行中のリアルタイムイベント(出品/入札/パス/配信)
- **REST**: ルーム管理(作成/一覧/参加/離脱/開始)
- OpenAPI 定義 + Swagger UI: `http://localhost:4000/docs`
- 型定義は `shared/events.ts` に集約

認証フロー全体は [06_authentication.md](./06_authentication.md) を参照。

## Socket.IO

### 認証

- クライアントは接続時に `auth.playerId` と `auth.roomId` を送信
  - `auth.playerId`: localStorage の `bluff-auction.playerId`(UUID)
  - `auth.roomId`: 入室中ルームの **UUID**(ハイフンなし 32 文字 hex)
- サーバーは `socket.data.playerId` / `socket.data.roomId`(UUID、lowercase 正規化済)を保持
- いずれか欠落 / UUID 形式不正で接続拒否

### Client → Server

| イベント | 引数 | ack | 前提フェーズ |
|---|---|---|---|
| `list-card` | `{ cardId, declaredBrand, startingBid }` | `AckResponse` | LISTING(出品者) |
| `bid` | `{ amount }` | `AckResponse` | BIDDING(出品者以外) |
| `pass` | — | `AckResponse` | BIDDING(出品者以外) |

```ts
type AckResponse = { ok: true } | { ok: false; code: string; message: string };
```

### エラーコード一覧

AckResponse / `error-event` / REST 400 系で返る `code`。

| code | 発生箇所 | 意味 |
|---|---|---|
| `not-lobby` | start/join/leave | ロビー以外での操作 |
| `not-ready` | start | 4人揃っていない |
| `full` | join | 定員到達 |
| `wrong-phase` | list-card/bid/pass | 想定外フェーズ |
| `not-your-turn` | list-card | 出品権なし |
| `no-player` | 共通 | プレイヤー不在 |
| `no-card` | list-card | 手札に該当カードなし |
| `bad-brand` | list-card | 不明なブランド |
| `bad-bid` | list-card | 初期落札額が不正 |
| `fake-limit` | list-card | フェイク使用上限(2回) |
| `no-auction` | bid/pass | 競り情報なし |
| `seller-cant-bid` | bid | 出品者は入札不可 |
| `seller-cant-pass` | pass | 出品者はパス不可 |
| `already-passed` | bid/pass | パス済み |
| `too-low` | bid | 最低落札額未満 |
| `no-cash` | bid | 所持金不足 |
| `unauthorized` | REST | `X-Player-Id` 欠落 |
| `not-host` | POST /rooms/:id/start | ホスト以外がゲーム開始操作 |
| `not-found` | GET /rooms/:id, POST /rooms/:id/players, GET /players/me | ルーム / プレイヤー未登録 |
| `bad-passphrase` | rooms 系全般 | 合言葉の形式不正(4文字 / 許可外文字) |
| `passphrase-exhausted` | POST /rooms | 合言葉生成の衝突再試行が上限超過 |
| `player-exists` | POST /players | `id` 既登録 |
| `db-error` | 共通 | DB 例外 |

### Server → Client

| イベント | 引数 | 送信先 |
|---|---|---|
| `view-update` | `GameView` | 各プレイヤー個別(視点フィルタ済み) |
| `auction-revealed` | `{ brand }` | 落札者のみ |
| `unsold-penalty` | `{ sellerId, amount, recipientIds[] }` | 全員 |
| `game-ended` | `{ winnerId }` | 全員 |
| `error-event` | `{ code, message }` | 送信元 |

## REST

ヘッダ `X-Player-Id` は localStorage の UUID。参加・離脱・開始・自分情報取得系で必須(401 を返す)。

### POST /players

- **概要**: プレイヤー登録(身元マスター `players` テーブルへ INSERT)。プレイヤー名登録画面の「開始」ボタンから呼び出し
  - クライアントが生成した UUID + 入力名をサーバー側で永続化、201 成功後に localStorage へ UUID 保存
- **Request**
  - Body: `{ id: string; name: string }`(`id` は UUID、`name` は1文字以上)
- **Response**
  - 201: 成功
  - 409: `{ code: "player-exists", message }` — `id` 既登録
  - 400: バリデーションエラー

### GET /players/me

- **概要**: 自分のプレイヤー情報取得(起動時の整合性チェック用)。`players` テーブルから `id` で引いて `name` を返す
  - 404 が返った場合、クライアントは登録画面を表示し localStorage の `bluff-auction.playerId` を削除
- **Request**
  - Headers: `X-Player-Id: string`
- **Response**
  - 200: `{ playerId: string; name: string }`
  - 401: `X-Player-Id` 欠落
  - 404: `{ code: "not-found", message }` — プレイヤー未登録

### ルームの識別子(URL は合言葉)について

- DB 上のルーム PK は `rooms.id`(UUID、ハイフンなし 32 文字 hex)
- ユーザーに見せる/URL パラメータに使う識別子は `rooms.passphrase`(4 文字)
- 全 `:id` パスパラメータは合言葉(passphrase)を受ける。サーバーで uppercase 正規化後、`rooms.id`(UUID)に解決して内部処理に渡す
- 詳細仕様は [02_data_model.md#合言葉roomspassphrase](./02_data_model.md#合言葉roomspassphrase) 参照
- 形式不正(4 文字でない、許可外文字を含む)の場合は `400 { code: "bad-passphrase" }`

### POST /rooms

- **概要**: 新規ルーム作成。主催画面遷移時に呼び出し
  - サーバーが UUID と合言葉を発行し、`rooms` 行を INSERT
  - 自動マッチメイキングなし、再戦時も必ず新規作成(1 ルーム = 1 ゲーム)
- **Request**: ボディなし
- **Response (201)**: `{ id: string; passphrase: string }`
  - `id`: UUID(ハイフンなし 32 文字 hex)、内部参照用
  - `passphrase`: 4 文字の合言葉、ユーザー共有用 / URL 用
- **Error**:
  - 503 `{ code: "passphrase-exhausted", message }` — 衝突再試行が上限に達した(全空間ほぼ枯渇時のみ)

### GET /rooms/:id

- **概要**: ルーム詳細(公開情報のみの観戦ビュー)。参加前画面で合言葉の存在確認や、観戦時に呼び出し
- **Request**
  - Params: `id: string`(4 文字の合言葉、大文字小文字どちらでも可)
- **Response**
  - 200: `GameView`(`self: null` で秘匿情報なし)
  - 400: `{ code: "bad-passphrase", message }` — 形式不正
  - 404: `{ code: "not-found", message }` — ルーム未存在

### POST /rooms/:id/players

- **概要**: ルーム参加(合言葉で対象ルームを指定)。`players` テーブルから登録名を取得して `room_players` 行を作成
  - **ホスト確定**: 当該ルーム初の参加者であれば、サーバーは併せて `rooms.host_player_id` を当該プレイヤーに設定(以降不変)
- **Request**
  - Params: `id: string`(合言葉)
  - Headers: `X-Player-Id: string`
  - Body: なし
- **Response**
  - 204: 成功(Socket.IO で `view-update` がブロードキャスト)
  - 400: `{ code: "bad-passphrase" \| "no-player" \| "not-lobby" \| "full", message }`
  - 401: `X-Player-Id` 欠落
  - 404: `{ code: "not-found", message }` — 合言葉に該当するルームなし

### DELETE /rooms/:id/players/me

- **概要**: ルーム離脱(自身のみ)。ロビー中の「退出」ボタンから呼び出し
- **Request**
  - Params: `id: string`(合言葉)
  - Headers: `X-Player-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code, message }` — ゲーム進行中は離脱不可
  - 401: `X-Player-Id` 欠落

### POST /rooms/:id/start

- **概要**: ゲーム開始。**ホストのみ操作可**。4人揃った状態で「開始」ボタンから呼び出し、成功後は `view-update` が全員へブロードキャストされ LISTING へ遷移
- **Request**
  - Params: `id: string`(合言葉)
  - Headers: `X-Player-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code: "not-lobby" \| "not-ready", message }` — ロビー外 / 4人未満
  - 401: `X-Player-Id` 欠落
  - 403: `{ code: "not-host", message }` — `X-Player-Id` が `rooms.host_player_id` と不一致
