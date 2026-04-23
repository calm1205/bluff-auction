# 04. 通信プロトコル

- **Socket.IO(双方向)**: ゲーム進行中のリアルタイムイベント(出品/入札/パス/配信)
- **REST**: ルーム管理(作成/一覧/参加/離脱/開始)
- OpenAPI 定義 + Swagger UI: `http://localhost:4000/docs`
- 型定義は `shared/events.ts` に集約

## Socket.IO

### 認証

- クライアントは接続時に `auth.userId` を送信
  - `io({ auth: { userId } })` で localStorage の UUID を渡す
- サーバーは `socket.data.userId` に保持

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
| `unauthorized` | REST | `X-User-Id` 欠落 |
| `not-found` | GET /rooms/:id, GET /players/me | ルーム未存在 / プレイヤー履歴なし |
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

ヘッダ `X-User-Id` は localStorage の UUID。参加・離脱・開始・自分情報取得系で必須(401 を返す)。

### GET /players/me

- **概要**: 自分の直近の登録名取得(起動時の整合性チェック用)。過去にルーム参加したことがあれば該当 `players` 行から `name` を返す
  - 独立した `users` テーブルは持たず、`players` 行の存在でユーザーの実在を判定
  - 404 が返った場合、クライアントはユーザー名登録画面を表示(`bluff-auction.userId` は保持したまま名前だけ再入力)
- **Request**
  - Headers: `X-User-Id: string`
- **Response**
  - 200: `{ userId: string; name: string }`
  - 401: `X-User-Id` 欠落
  - 404: `{ code: "not-found", message }` — プレイヤー履歴なし

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

- **概要**: ルーム参加。名前入力後の「参加」ボタンから呼び出し
- **Request**
  - Params: `id: string`
  - Headers: `X-User-Id: string`
  - Body: `{ name: string }`(1文字以上)
- **Response**
  - 204: 成功(Socket.IO で `view-update` がブロードキャスト)
  - 400: `{ code, message }` — 進行中/満員など
  - 401: `X-User-Id` 欠落

### DELETE /rooms/:id/players/me

- **概要**: ルーム離脱(自身のみ)。ロビー中の「退出」ボタンから呼び出し
- **Request**
  - Params: `id: string`
  - Headers: `X-User-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code, message }` — ゲーム進行中は離脱不可
  - 401: `X-User-Id` 欠落

### POST /rooms/:id/start

- **概要**: ゲーム開始。4人揃った状態で「開始」ボタンから呼び出し、成功後は `view-update` が全員へブロードキャストされ LISTING へ遷移
- **Request**
  - Params: `id: string`
  - Headers: `X-User-Id: string`
- **Response**
  - 204: 成功
  - 400: `{ code: "not-lobby" | "not-ready", message }` — ロビー外 / 4人未満
  - 401: `X-User-Id` 欠落

## ユーザー管理

### localStorage

| key | value | 用途 |
|---|---|---|
| `bluff-auction.userId` | UUID 文字列 | ユーザー識別子 |

- 未保存ならユーザー名登録画面を表示
- 表示名は localStorage に保存せず、起動時の `GET /players/me` で過去の参加履歴から取得してメモリ(Zustand store)で保持
- 初回登録時はサーバー呼び出しなし(UUID は localStorage に即時保存、名前は最初のルーム参加時に `players` 行として DB へ永続化)

### 識別子

- **UserId**: `bluff-auction.userId`(UUID)
- PlayerId は UserId のエイリアス(ゲーム文脈)
- Socket.IO: `socket.handshake.auth.userId` → `socket.data.userId`
- REST: `X-User-Id` ヘッダ

### 認証強度

- プロトタイプでは UUID のみ(なりすまし可能な前提)
- 友人内プレイ想定、本格認証は範囲外

### 表示名

- DB 永続化先は `players.name`(ルーム参加時に記録)。クライアントはメモリ保持のみ(localStorage 非永続)
- 自由入力・重複可、ルーム参加時は `POST /rooms/:id/players` のボディへ送信
- プレイヤー区別は UserId(非表示)で行う
