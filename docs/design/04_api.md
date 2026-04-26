# 04. 通信プロトコル

- **Socket.IO(双方向)**: ゲーム進行中のリアルタイムイベント(出品/入札/パス/配信)
- **REST**: ルーム管理(作成/一覧/参加/離脱/開始)
- OpenAPI 定義 + Swagger UI: `http://localhost:4000/docs`
- 型定義は `shared/events.ts` に集約

認証フロー全体は [06_authentication.md](./06_authentication.md) を参照。

## Socket.IO

### 認証

- クライアントは接続時に `auth.playerId` と `auth.roomId` を送信
  - `io({ auth: { playerId, roomId } })` で localStorage の UUID と入室中ルーム ID を渡す
- サーバーは `socket.data.playerId` / `socket.data.roomId` に保持
- いずれか欠落で接続拒否

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
| `not-found` | GET /rooms/:id, GET /players/me | ルーム / プレイヤー未登録 |
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

### POST /rooms

- **概要**: 新規ルーム作成(ユーザー操作)。ルーム一覧画面の「新規ルーム作成」ボタン、および終了画面の「新ルーム作成(再戦)」から呼び出し
  - 自動マッチメイキング・自動割当は行わず、必ずユーザーが明示的に作成
  - 1ルーム=1ゲーム設計のため、再戦時も必ず新規作成
- **Request**: ボディなし
- **Response (201)**: `{ id: string }` — UUID

### GET /rooms

- **概要**: ルーム一覧取得。ルーム一覧画面の表示時に呼び出し
- **Request**: なし
- **Response (200)**: `Array<{ id: string; phase: string; playerCount: integer }>`

### GET /rooms/:id

- **概要**: ルーム詳細(公開情報のみの観戦ビュー)。ルーム URL を直接開いた時や観戦時に呼び出し
- **Request**
  - Params: `id: string`
- **Response**
  - 200: `GameView`(`self: null` で秘匿情報なし)
  - 404: `{ code: "not-found", message }` — ルーム未存在

### POST /rooms/:id/players

- **概要**: ルーム参加。`players` テーブルから登録名を取得して `room_players` 行を作成
- **Request**
  - Params: `id: string`
  - Headers: `X-Player-Id: string`
  - Body: なし(名前は `players` テーブルから自動取得)
- **Response**
  - 204: 成功(Socket.IO で `view-update` がブロードキャスト)
  - 400: `{ code: "no-player" \| "not-lobby" \| "full", message }` — プレイヤー未登録 / 進行中 / 満員
  - 401: `X-Player-Id` 欠落

### DELETE /rooms/:id/players/me

- **概要**: ルーム離脱(自身のみ)。ロビー中の「退出」ボタンから呼び出し
- **Request**
  - Params: `id: string`
  - Headers: `X-Player-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code, message }` — ゲーム進行中は離脱不可
  - 401: `X-Player-Id` 欠落

### POST /rooms/:id/start

- **概要**: ゲーム開始。4人揃った状態で「開始」ボタンから呼び出し、成功後は `view-update` が全員へブロードキャストされ LISTING へ遷移
- **Request**
  - Params: `id: string`
  - Headers: `X-Player-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code: "not-lobby" | "not-ready", message }` — ロビー外 / 4人未満
  - 401: `X-Player-Id` 欠落
