# 05. フロントエンド設計

## 全体構成

ゲーム開始(`POST /rooms/:id/start` 成功 → phase = LISTING)を境に、画面体験を **ゲーム前(プレロビー)** と **ゲーム中(プレイ)** の 2 系統に分ける。

```
ゲーム前(phase = lobby) ──── start ────▶ ゲーム中(phase = listing/bidding/transaction/ended)
  - 認証/登録
  - ルーム選択
  - 入室・参加待機
                                            - オークション進行
                                            - 勝者確定 → 終了画面
```

- 各系統の中で更に画面が遷移する
- ゲーム中は phase 遷移と即時連動して UI が切り替わる(画面遷移ではなく状態更新で表示)

## 共通ヘッダー

- プレイヤー登録画面以外の全画面で、画面上部に常に自分のユーザー名(Zustand store の `userName`)を表示
- 表示位置は固定ヘッダー、どの画面(ルーム一覧/ロビー/ゲーム/終了)でも視認できる
- 目的: 現在どのアカウントでプレイしているかを常に明示
- 実装: App 直下の `<UserBadge />` 共通コンポーネント

---

## ゲーム前(プレロビー)

ゲーム開始までの導線。3 つの画面で構成。

### A. プレイヤー登録画面(初回アクセス時・整合不一致時)

- **表示条件**: 以下いずれか
  - localStorage の `bluff-auction.playerId` が未保存
  - アプリ起動時の `GET /players/me` 検証で 404 が返り、`players` テーブルに該当 UUID なし
- **要素**: 名前入力フィールド(1文字以上、自由入力・重複可)+「開始」ボタン
- **「開始」ボタン押下時**:
  1. `crypto.randomUUID()` で UUID を生成
  2. `POST /players` で `{ id, name }` をサーバー登録(`players` テーブルへ INSERT)
  3. 201 成功後に `bluff-auction.playerId` へ保存
  4. 表示名を Zustand store へ反映 → ルーム一覧画面へ遷移
  5. 失敗時は localStorage を更新せずエラー表示
- 以降の起動は下記「起動時の整合性チェック」を通過した場合のみこの画面をスキップ

### 起動時の整合性チェック

- アプリマウント直後、localStorage に `bluff-auction.playerId` がある場合は `GET /players/me` で検証
  - 200: 返却された `name` を Zustand store の `userName` に反映 → ルーム一覧画面へ
  - 404(`players` テーブルに該当 UUID なし): localStorage の `bluff-auction.playerId` を削除 → 登録画面へ
  - ネットワークエラー: エラー表示 + 再試行ボタン
- 目的: DB リセット・別環境接続・手動削除などで UUID が失効した際の不整合を解消

### B. ルーム一覧画面(ルーム未選択時)

- ルームはユーザーが手動で作成・選択(自動マッチメイキングなし)
- **要素**:
  - 既存ルーム一覧(`GET /rooms`): id / phase / 参加人数
    - LOBBY かつ空きありの行のみ参加可
    - 進行中/満員はグレーアウト(観戦リンクのみ)
  - 「新規ルーム作成」ボタン(`POST /rooms` → 作成したルームへ遷移)

### C. ロビー画面(phase = LOBBY)

- ルーム入室直後の待機画面。4 人揃うまでここで待つ
- **要素**:
  - 参加ボタン(`POST /rooms/:id/players`、ボディなし。サーバーが `players` マスターから登録名を取得して `room_players` 行を作成)
  - 参加者リスト(最大 4 名)
  - 「ゲーム開始」ボタン(4 人揃いで有効化、`POST /rooms/:id/start`)
  - 「退出」ボタン(ルーム一覧へ戻る)
- 「ゲーム開始」成功で全員へ `view-update` がブロードキャストされ、phase が LISTING へ → 全クライアントが ゲーム中画面に切り替わる

---

## ゲーム中(プレイ)

`phase ≠ lobby` の間ずっと表示される画面。phase に応じて中央領域の操作が変わる。

### D. ゲーム画面(phase = listing / bidding / transaction)

```
┌───────────────────────────────────────────┐
│ UserBadge(固定ヘッダー)                  │
├───────────────────────────────────────────┤
│ 上段: 他プレイヤー 3 人                   │  ← OpponentList
│   名前 / 所持金 / カード枚数 / 状態       │
├───────────────────────────────────────────┤
│ 中段: 競り場(現在の出品状況)            │  ← AuctionArea
│   出品者 / 宣言ブランド / 現在最高入札    │
│   ─ 自分が出品者:                         │
│       カード選択 → 宣言 → 開始額 → 出品   │
│   ─ 自分が入札者:                         │
│       入札額入力 / パス                   │
│   ─ 自分が傍観:                           │
│       状況表示のみ                        │
├───────────────────────────────────────────┤
│ 下段: 自分の手札 / 所持金 / フェイク残数  │  ← MyHand, MyStats
└───────────────────────────────────────────┘
```

- phase 遷移は `view-update` イベントで即時反映(画面遷移なし、コンポーネント再レンダリング)
- LISTING / BIDDING / TRANSACTION は同じレイアウト、中段の操作のみ切り替わる
- 落札確定時 `auction-revealed` を落札者のみが受信し、`lastRevealed` に格納してハイライト表示

### E. 終了画面(phase = ENDED)

- ゲーム画面と置き換わって表示
- **要素**:
  - 勝者表示
  - 「新ルーム作成(再戦)」ボタン(`POST /rooms` → 新ルームへ遷移)
    - 同一ルームでの再戦は不可、ENDED は終端
  - 「ルーム一覧へ戻る」ボタン

---

## React コンポーネント階層

```
<App>
 ├ <NameRegister />                  プレイヤー登録(localStorage 未登録時のみ、UserBadge は非表示)
 ├ <UserBadge />                     登録後は常時表示
 ├──────────── ゲーム前 ────────────
 ├ <RoomList />                      ルーム未選択時
 ├ <Lobby />                         phase = lobby
 ├──────────── ゲーム中 ────────────
 ├ <GameBoard>                       phase = listing/bidding/transaction
 │   ├ <OpponentList />
 │   ├ <AuctionArea>
 │   │   ├ <ListingForm />           自分が出品者時
 │   │   ├ <BiddingForm />           自分が入札者時
 │   │   └ <AuctionStatus />
 │   ├ <MyHand />
 │   └ <MyStats />
 └ <EndedScreen />                   phase = ended
```

ルーティング判定(`App.tsx`):

| 状態 | 表示 |
|---|---|
| `userName` 未取得 | NameRegister |
| `roomId` 未選択 | RoomList |
| `view.phase === "lobby"` | Lobby |
| `view.phase === "ended"` | EndedScreen |
| その他(listing/bidding/transaction) | GameBoard |

## 状態管理

Zustand store で以下を保持:

| キー | 型 | 用途 |
|---|---|---|
| `userName` | `string \| null` | 起動時 `GET /players/me` / 登録後に設定。UserBadge ・参加リクエストで参照 |
| `roomId` | `string \| null` | 入室中ルーム |
| `view` | `GameView \| null` | サーバーからの `view-update` で置換、UI 全体の真実源 |
| `lastRevealed` | `{ brand: Brand } \| null` | `auction-revealed` 受信時に設定、自分が落札したカードの実種別をハイライト |
| `winnerId` | `PlayerId \| null` | `game-ended` 受信時に設定 |
| `lastError` | `string \| null` | `error-event` 受信時に設定 |

各コンポーネントは必要部分のみ select してレンダリング。

## 補助定義

- `BRAND_LABELS`(`shared/constants.ts`): ブランド英語キー → 日本語ラベル対応(例: `painting` → 「絵画」)
- 画面表示には必ず `BRAND_LABELS[brand]` を経由
