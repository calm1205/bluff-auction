# Bluff Auction — システム設計

## 1. 概要
- 4人対戦のオンラインカード競売ゲームのローカル動作プロトタイプ
- ルール仕様は `rule.md` を正とする
- 本ドキュメントは実装のための技術設計

## 2. 技術スタック

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Socket.IO + TypeScript
- **共有コード**: npm workspaces で型・定数・純粋ロジックを共有
- **永続化**: PostgreSQL(Drizzle ORM、サーバー起動時に自動マイグレーション)
- **実行環境**: docker-compose(postgres / server / client の3サービス)

## 3. プロジェクト構造

```
bluff-auction/
├── package.json              # npm workspace ルート
├── tsconfig.base.json        # 共通TS設定
├── packages/
│   ├── shared/               # 型・イベント定義・純粋ロジック
│   │   ├── src/
│   │   │   ├── types.ts      # ドメイン型
│   │   │   ├── events.ts     # Socket.IO イベント型
│   │   │   ├── constants.ts  # $100, 手札4枚 等の定数
│   │   │   └── rules.ts      # 勝利判定など純粋関数
│   │   └── package.json
│   ├── server/               # Node.js Socket.IO サーバー
│   │   ├── src/
│   │   │   ├── index.ts      # エントリポイント
│   │   │   ├── roomManager.ts
│   │   │   ├── gameEngine.ts # 状態機械
│   │   │   └── viewFilter.ts # 視点別state生成
│   │   └── package.json
│   └── client/               # React クライアント
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── hooks/
│       │   │   └── useSocket.ts
│       │   └── state/        # Zustand or useReducer
│       ├── index.html
│       └── package.json
├── rule.md                   # ゲームルール(既存)
├── idea.md                   # 初期アイデア(既存)
└── design.md                 # 本ドキュメント
```

## 4. 設計方針

### Server-authoritative
- すべてのゲーム状態はサーバー側メモリに保持
- クライアントは自分視点にフィルタされた状態のみ受信
- 秘匿情報(ブランド、カード種別、手札、他人のコレクション内容)はサーバー側でフィルタリング
- クライアントからの操作はすべてサーバーで検証

### 隠蔽情報の一覧

| 情報 | 公開 | 本人のみ | 落札者のみ |
|---|---|---|---|
| プレイヤー名 | ○ | | |
| 所持金 | ○ | | |
| フェイク使用回数 | ○ | | |
| 手札枚数 | ○ | | |
| コレクション枚数 | ○ | | |
| 自分のブランド | | ○ | |
| 自分の手札内容 | | ○ | |
| 自分のコレクション内容 | | ○ | |
| 他人のブランド | | ✕(推理のみ) | |
| 現在の競りの実種別 | | | ○(落札確定後) |
| 宣言種別 | ○ | | |
| 入札履歴 | ○ | | |

### リアルタイム通信
- Socket.IO による双方向 WebSocket
- 型付けされたイベント契約(`shared/events.ts`)
- 接続断は中断扱い(プロトタイプでは再接続復元しない)

## 5. ドメインモデル

### 主要型(shared/types.ts)

```ts
type Brand = 'painting' | 'sculpture' | 'pottery' | 'jewelry';

type Card = {
  id: string;
  brand: Brand;
};

type PlayerId = string;

type Player = {
  id: PlayerId;
  name: string;
  brand: Brand;         // 秘匿
  hand: Card[];         // 秘匿
  collection: Card[];   // 本人以外は枚数のみ
  cash: number;         // 公開
  fakesUsed: number;    // 公開
  passed: boolean;      // 現競りでのパス状態
};

type Auction = {
  sellerId: PlayerId;
  card: Card;           // 秘匿(落札者確定時に開示)
  declaredBrand: Brand; // 公開
  startingBid: number;  // 公開
  currentBid: number;
  highestBidderId: PlayerId | null;
  passedPlayerIds: PlayerId[];
};

type Phase = 'lobby' | 'listing' | 'bidding' | 'transaction' | 'ended';

type GameState = {
  phase: Phase;
  turnIndex: number;         // 0..3
  players: Player[];
  currentAuction: Auction | null;
  winnerId: PlayerId | null;
  turnOrder: PlayerId[];     // 時計回り順
};
```

### 視点別ビュー

```ts
type PublicPlayerView = {
  id, name,
  cash, fakesUsed,
  handCount, collectionCount,
  passed,
};

type SelfPlayerView = PublicPlayerView & {
  brand: Brand,
  hand: Card[],
  collection: Card[],
};

type GameView = {
  phase, turnIndex, turnOrder, winnerId,
  self: SelfPlayerView,
  others: PublicPlayerView[],
  currentAuction: Omit<Auction, 'card'> | null,
};
```

## 6. 状態機械

```
LOBBY
  │ (4人参加 → start-game)
  ▼
LISTING  ←──────────────┐
  │ (出品者が list-card)│
  ▼                     │
BIDDING                 │
  │ (全員パス or 単独高値)
  ▼                     │
TRANSACTION             │
  │ (清算・勝利判定)    │
  ├──(勝者なし)─────────┘
  │
  ▼
ENDED
```

### フェーズごとの許可操作
- LOBBY: `join-room`, `leave-room`, `start-game`
- LISTING: `list-card`(出品者のみ)
- BIDDING: `bid`, `pass`(出品者以外)
- TRANSACTION: 自動処理、プレイヤー操作なし
- ENDED: なし(ロビー戻り or 終了)

## 7. 通信プロトコル

### Client → Server

| イベント | 引数 | 前提フェーズ |
|---|---|---|
| `join-room` | `{ name }` | LOBBY |
| `leave-room` | — | LOBBY |
| `start-game` | — | LOBBY(4人揃い) |
| `list-card` | `{ cardId, declaredBrand, startingBid }` | LISTING(出品者) |
| `bid` | `{ amount }` | BIDDING |
| `pass` | — | BIDDING |

### Server → Client

| イベント | 引数 | 送信先 |
|---|---|---|
| `view-update` | `GameView` | 各プレイヤー個別 |
| `auction-revealed` | `{ brand }` | 落札者のみ |
| `unsold-penalty` | `{ sellerId, amount, recipients[] }` | 全員 |
| `game-ended` | `{ winnerId }` | 全員 |
| `error` | `{ code, message }` | 送信元 |

## 8. 主要ロジック

### 初期化(start-game)
- 4ブランドを4プレイヤーにランダム割り当て
- 各プレイヤーに自ブランドのカードを4枚生成して手札へ
- 各プレイヤーの `cash = 100`, `fakesUsed = 0`
- `turnOrder` をシャッフルして決定
- phase: LOBBY → LISTING

### 出品検証(list-card)
- sender が `turnOrder[turnIndex]` と一致
- `cardId` が sender の hand に存在
- `declaredBrand` が Brand 型のいずれか
- `declaredBrand !== sender.brand` の場合(フェイク判定)
  - `sender.fakesUsed < 2` を要求(達していれば拒否)
- `0 <= startingBid <= sender.cash`
- 合格で Auction 生成、phase: LISTING → BIDDING

### 入札検証(bid)
- phase が BIDDING
- sender が `currentAuction.sellerId` でない
- sender が `passedPlayerIds` に含まれない
- `amount > currentAuction.currentBid`
- `amount <= sender.cash`
- 合格で `currentBid`, `highestBidderId` を更新しブロードキャスト

### パス処理(pass)
- sender を `passedPlayerIds` に追加
- 残り入札者が1人(or 全員パス)なら競り終了
  - 誰か高値入札者がいる → TRANSACTION へ
  - 全員パス(誰も入札してない)→ 流札処理 → LISTING(次ターン)

### 流札処理
- seller.cash から `startingBid` を減算
- 他3プレイヤーに `floor(startingBid / 3)` ずつ分配
- カードは seller の hand に戻る
- `fakesUsed` は増やさない
- `unsold-penalty` イベント送信

### 取引処理(TRANSACTION)
- `highestBidder.cash -= currentBid`
- `seller.cash += currentBid`
- カードを seller.hand から highestBidder.collection へ移動
- `auction-revealed` を落札者のみに送信
- 宣言種別と実種別が異なっていれば `seller.fakesUsed += 1`
- 勝利判定: 落札者の (hand + collection) に4ブランド全種含むか
  - 含む → `winnerId` 設定、phase: ENDED、`game-ended` 送信
  - 含まない → turnIndex 進めて LISTING へ

### 勝利判定(純粋関数、shared/rules.ts)

```ts
export function hasFullSet(player: Player): boolean {
  const brands = new Set<Brand>();
  [...player.hand, ...player.collection].forEach(c => brands.add(c.brand));
  return brands.size === 4;
}
```

## 9. UI 設計

### 画面構成
- **ロビー画面**(phase = LOBBY)
  - 名前入力 + 参加ボタン
  - 参加者リスト(最大4名)
  - ゲーム開始ボタン(4人揃いで有効化)
- **ゲーム画面**(phase ≠ LOBBY)
  - 上段: 他プレイヤー3人のカード(名前、手札枚数、コレクション枚数、所持金、フェイク残数)
  - 中段: 現在の出品状況
    - 出品者名 / 宣言ブランド / 現在の入札額 / 最高入札者
    - 自分が出品者: カード選択→宣言→初期落札額入力→出品
    - 自分が入札者: 入札額入力 or パス
    - 自分が傍観: 状況表示のみ
  - 下段: 自分の手札(表向き)・コレクション(表向き)・所持金・フェイク残数
- **終了画面**(phase = ENDED)
  - 勝者表示、再戦ボタン

### React コンポーネント階層(概略)

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
    ├ <MyCollection />
    └ <MyStats />
```

### 状態管理
- socket 接続と `GameView` は Zustand store(または useReducer + Context)で保持
- 各コンポーネントは必要部分のみ select

## 10. 実装順序

1. monorepo 初期化(npm workspaces, TypeScript, tsconfig)
2. `shared` パッケージ: 型・定数・勝利判定
3. `server` パッケージ: Socket.IO 起動、roomManager、gameEngine、viewFilter
4. サーバー単体テスト(ゲーム1周をプログラムで検証)
5. `client` パッケージ: Vite 初期化、Socket 接続、ロビー画面
6. ゲーム画面 UI 実装(出品・入札・傍観の3モード)
7. 4タブでローカル対戦動作確認
8. エッジケース調整(流札・フェイク上限・勝利判定)

## 11. ユーザー管理

### 識別子
- **UserId**: localStorage に保存される UUID(初回アクセス時に生成)
- PlayerId は UserId のエイリアス(ゲーム文脈)
- サーバーは `socket.handshake.auth.userId` で受信、`socket.data.userId` に保持

### 認証強度
- プロトタイプでは UUID のみ(なりすまし可能な前提)
- 友人内プレイ想定、本格認証は範囲外

### 接続ライフサイクル

| イベント | フェーズ | 動作 |
|---|---|---|
| 新規接続(LOBBY) | lobby | `join-room` で addPlayer 可 |
| 再接続(LOBBY) | lobby | 既存UserIdなら online=true に戻す |
| 新規接続(進行中) | non-lobby | 参加不可、傍観のみ |
| 再接続(進行中) | non-lobby | 席に復帰、online=true |
| 切断(LOBBY) | lobby | 即座に離脱(他のプレイヤーが参加できるように) |
| 切断(進行中) | non-lobby | online=false で席を保持、再接続待ち |

### 表示名
- ユーザーが自由入力、重複可
- 他プレイヤーとの区別は UserId(非表示)で行う

## 12. 非対応(プロトタイプ範囲外)
- 本格認証(ログイン、JWT、パスワード)
- 複数ルーム・マッチメイキング(スキーマは `rooms` テーブルで複数対応済み、UI 未実装)
- 切断タイムアウトによる強制離脱(現状は無期限保持)
- Redis Socket.IO adapter による水平スケール
- 本番デプロイ用マニフェスト、TLS、CI/CD
- モバイル最適化UI
- AI 対戦プレイヤー

## 13. 永続化スキーマ

Drizzle ORM で定義、Postgres 上に以下のテーブル:

- `rooms` (id, phase, turn_index, turn_order[], winner_id, updated_at)
- `players` (room_id, user_id, name, brand, cash, fakes_used, passed, online, seat_index) — PK (room_id, user_id)
- `cards` (id, room_id, brand, holder_id, location) — location: `hand` | `collection` | `auction`
- `auctions` (room_id PK, seller_id, card_id, declared_brand, starting_bid, current_bid, highest_bidder_id, passed_player_ids[])

### トランザクション境界

各 Socket.IO イベントハンドラが `withTx` で単一トランザクションを形成:

1. `loadRoomState(tx)` でフル状態を DB から再構築
2. `gameEngine` の純粋関数で状態をメモリ上で変更
3. `saveRoomState(tx, state)` で全テーブルを削除+再挿入
4. コミット後に Socket.IO でビュー配信

イベント単位の ACID を担保するが、楽観ロックは未実装(同一ルーム内の並行書き込みは直列化のみ)。

### マイグレーション

- `packages/server/drizzle/` に SQL 配置
- サーバー起動時 `runMigrations()` が自動適用
- スキーマ変更は `npm run db:generate` で新マイグレーション生成
