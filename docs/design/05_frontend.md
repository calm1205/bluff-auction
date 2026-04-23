# 05. フロントエンド設計

## 画面構成

### ロビー画面(phase = LOBBY)

- 名前入力 + 参加ボタン
- 参加者リスト(最大4名)
- ゲーム開始ボタン(4人揃いで有効化)

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

- `view: GameView | null` — サーバーからの `view-update` で置換、UI 全体の真実源
- `lastRevealed: { brand: Brand } | null` — `auction-revealed` 受信時に設定、自分が落札したカードの実種別をハイライト表示
- Socket 接続ハンドル(再接続・エラー制御)

各コンポーネントは必要部分のみ select してレンダリング。

## 補助定義

- `BRAND_LABELS`(`shared/constants.ts`): ブランド英語キー → 日本語ラベル対応(例: `painting` → 「絵画」)
- 画面表示には必ず `BRAND_LABELS[brand]` を経由
