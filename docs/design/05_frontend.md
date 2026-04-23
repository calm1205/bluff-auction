# 05. フロントエンド設計

## 共通ヘッダー

- ユーザー名登録画面以外の全画面で、画面上部に常に自分のユーザー名(Zustand store の `userName`、起動時に `GET /players/me` で取得)を表示
- 表示位置は固定ヘッダー、どの画面(ルーム一覧/ロビー/ゲーム/終了)でも視認できる
- 目的: 現在どのアカウントでプレイしているかを常に明示
- 実装は App 直下の `<UserBadge />` 等の共通コンポーネントで提供

## 画面構成

### ユーザー名登録画面(初回アクセス時・整合不一致時)

- 表示条件: 以下いずれか
  - localStorage の `bluff-auction.userId` が未保存
  - アプリ起動時の `GET /players/me` 検証で 404 が返り、過去の参加履歴がない
- 名前入力フィールド(1文字以上、自由入力・重複可)
- 「開始」ボタン押下で:
  - UUID を生成して `bluff-auction.userId` へ保存(サーバー呼び出しなし)
  - 表示名を Zustand store へ反映してルーム一覧画面へ遷移
  - 名前は最初のルーム参加時に `POST /rooms/:id/players` 経由で DB(`players.name`)へ永続化
- 以降の起動は下記「起動時の整合性チェック」を通過した場合のみこの画面をスキップ

### 起動時の整合性チェック

- アプリマウント直後、localStorage に `bluff-auction.userId` がある場合は `GET /users/:id` で検証
  - 200: 返却された `name` を Zustand store の `userName` に反映し、そのままルーム一覧画面へ
  - 404(DB に該当 UUID なし): localStorage(`bluff-auction.userId`)を削除してユーザー名登録画面へリダイレクト
  - ネットワークエラー: 登録画面へは遷移せず、エラー表示 + 再試行可能に
- 目的: DB リセット・別環境接続・手動削除などで UUID が失効した際の不整合状態を防ぐ

### ルーム一覧画面(ルーム未選択時)

- ルームはユーザーが手動で作成・選択
- 既存ルーム一覧(`GET /rooms`): id / phase / 参加人数を表示
  - LOBBY かつ空きありの行のみ参加可
  - 進行中/満員はグレーアウト(観戦リンクのみ)
- 「新規ルーム作成」ボタン(`POST /rooms` → 作成したルームへ遷移)
- 自動マッチメイキングは行わない

### ロビー画面(phase = LOBBY)

- 参加ボタン(`POST /rooms/:id/players`、名前は Zustand store の `userName` を送信)
- 参加者リスト(最大4名)
- ゲーム開始ボタン(4人揃いで有効化)
- 退出ボタン(ルーム一覧へ戻る)

### ゲーム画面(phase ≠ LOBBY)

- **上段**: 他プレイヤー3人
  - 名前 / 所持金 / カード枚数
- **中段**: 現在の出品状況
  - 出品者名 / 宣言ブランド / 現在の入札額 / 最高入札者
  - 自分が出品者: カード選択 → 宣言 → 初期落札額入力 → 出品
  - 自分が入札者: 入札額入力 or パス
  - 自分が傍観: 状況表示のみ
- **下段**: 自分の手札(表向き、初期配布+落札入手) / 所持金 / フェイク残数

### 終了画面(phase = ENDED)

- 勝者表示
- 「新ルーム作成」ボタン(`POST /rooms` → 新ルームへ遷移)
  - 同一ルームでの再戦は不可、ENDED は終端

## React コンポーネント階層

```
<App>
 ├ <NameRegister />        (localStorage 未登録時のみ、UserBadge は非表示)
 ├ <UserBadge />           (登録後は常時表示、自分の userName を表示)
 ├ <RoomList />            (ルーム未選択時、一覧+新規作成)
 ├ <Lobby />               (LOBBY)
 └ <GameBoard>             (非LOBBY)
    ├ <OpponentList />
    ├ <AuctionArea>
    │   ├ <ListingForm />  (自分が出品者時)
    │   ├ <BiddingForm />  (自分が入札者時)
    │   └ <AuctionStatus />
    ├ <MyHand />
    └ <MyStats />
```

## 状態管理

Zustand store(または useReducer + Context)で以下を保持:

- `userName: string | null` — 起動時 `GET /users/:id` / 登録後に設定、UserBadge や参加リクエストで参照
- `roomId: string | null` — 入室中ルーム
- `view: GameView | null` — サーバーからの `view-update` で置換、UI 全体の真実源
- `lastRevealed: { brand: Brand } | null` — `auction-revealed` 受信時に設定、自分が落札したカードの実種別をハイライト表示
- Socket 接続ハンドル(再接続・エラー制御)

各コンポーネントは必要部分のみ select してレンダリング。

## 補助定義

- `BRAND_LABELS`(`shared/constants.ts`): ブランド英語キー → 日本語ラベル対応(例: `painting` → 「絵画」)
- 画面表示には必ず `BRAND_LABELS[brand]` を経由
