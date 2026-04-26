# 01. シーケンス

状態機械・フェーズ遷移は [03_state_flow.md](./03_state_flow.md) を参照。

## ゲーム開始前(プレロビー)

プレイヤー登録 → ルーム作成 / 参加 → 4 人揃って開始のフロー。REST が主軸、参加完了後に Socket.IO に切り替わる。

```mermaid
sequenceDiagram
    autonumber
    participant H as 主催者(ブラウザ)
    participant G as ゲスト(ブラウザ)
    participant Srv as サーバー
    participant DB as Postgres

    Note over H,G: 起動 → プレイヤー登録(初回のみ)
    H->>Srv: POST /players { id, name }
    Srv->>DB: INSERT INTO players
    Srv-->>H: 201
    G->>Srv: POST /players { id, name }
    Srv->>DB: INSERT INTO players
    Srv-->>G: 201

    Note over H: 主催画面へ
    H->>Srv: POST /rooms
    Srv->>Srv: 合言葉(4文字)を生成・衝突チェック
    Srv->>DB: INSERT INTO rooms (id=PASS)
    Srv-->>H: 201 { id: "PASS" }

    Note over H: 主催者の自動参加(初参加でホスト確定)
    H->>Srv: POST /rooms/PASS/players<br/>X-Player-Id: H
    Srv->>DB: SELECT name FROM players
    Srv->>DB: INSERT INTO room_players<br/>UPDATE rooms.host_player_id = H
    Srv-->>H: 204

    Note over H: Socket.IO 接続(auth.playerId, auth.roomId)
    H->>Srv: connect (handshake)
    Srv-->>H: view-update

    Note over G: 参加前画面で合言葉入力
    G->>Srv: POST /rooms/PASS/players<br/>X-Player-Id: G
    Srv->>DB: SELECT room → SELECT name → INSERT room_players
    Srv-->>G: 204
    G->>Srv: connect (handshake)
    Srv-->>H: view-update (参加者更新)
    Srv-->>G: view-update

    Note over Srv: 4 人揃った時点で「開始」ボタンが有効化(ホストのみ)
    H->>Srv: POST /rooms/PASS/start<br/>X-Player-Id: H
    Srv->>Srv: host_player_id == H ? OK : 403
    Srv->>Srv: ブランド配布 / 手札生成 / phase=LISTING
    Srv->>DB: 状態保存
    Srv-->>H: 204
    Srv-->>H: view-update (LISTING)
    Srv-->>G: view-update (LISTING)
```

主な分岐:

- 既登録ユーザーの起動時整合性チェック(`GET /players/me`)→ 200 ならスキップ、404 なら登録画面
- 合言葉衝突は最大 N 回再試行、超過すると 503 `passphrase-exhausted`
- 非ホストの `POST /rooms/:id/start` は 403 `not-host`
- 4 人未満なら 400 `not-ready`

## ゲーム開始後(プレイ中)

`phase = listing/bidding/transaction/ended` の間。Socket.IO の双方向イベントが主軸。

```mermaid
sequenceDiagram
    autonumber
    participant S as 出品者
    participant O as 他プレイヤー
    participant Srv as サーバー

    Note over Srv: LISTING
    S->>Srv: list-card
    Srv->>Srv: 検証 → Auction生成 → BIDDING
    Srv-->>S: view-update
    Srv-->>O: view-update

    Note over Srv: BIDDING
    loop 競り上げ
        O->>Srv: bid or pass
        Srv->>Srv: auction_actions に append
        Srv-->>S: view-update
        Srv-->>O: view-update
    end

    alt 単独高値残り
        Note over Srv: TRANSACTION
        Srv->>Srv: 清算 / auctions・auction_actions 削除
        Srv-->>O: auction-revealed (落札者のみ)
        Srv-->>S: view-update
        Srv-->>O: view-update
        alt 勝者あり
            Srv-->>S: game-ended
            Srv-->>O: game-ended
        else 勝者なし
            Srv->>Srv: turnIndex++ → LISTING
        end
    else 全員パス(流札)
        Srv->>Srv: startingBidを他3人に分配 / auctions・auction_actions 削除
        Srv-->>S: unsold-penalty
        Srv-->>O: unsold-penalty
        Srv->>Srv: LISTING(次ターン)
    end
```

主な分岐:

- 出品者オフライン時は進行停止(再接続待ち)
- フェイク宣言は `seller.fakesUsed` で消費(落札成立時のみ加算、流札時は据え置き)
- 落札者の手札に 4 ブランド全種 → ENDED へ

## 接続ライフサイクル

ルーム作成・参加・離脱は REST(ユーザーが手動操作)、オンライン状態同期は Socket.IO。

| イベント | フェーズ | 動作 |
|---|---|---|
| ルーム作成 | — | `POST /rooms` で合言葉発行、主催者は続けて参加リクエスト(REST) |
| ルーム参加 | LOBBY | `POST /rooms/:passphrase/players` で addPlayer(REST) |
| Socket 新規接続 | LOBBY | 既参加なら online=true に戻し、未参加なら観戦のみ |
| Socket 再接続 | 進行中 | 席に復帰、online=true、直後に `view-update` を1回受信 |
| 新規接続 | 進行中 | 参加不可、観戦のみ(`self: null` で view 受信) |
| ルーム離脱 | LOBBY | `DELETE /rooms/:passphrase/players/me`(REST) |
| Socket 切断 | LOBBY 既参加 | 即座に離脱(他プレイヤーが参加できるように) |
| Socket 切断 | 進行中 | online=false で席を保持、再接続待ち |

- Socket.IO 接続時は `auth.playerId` / `auth.roomId` 必須(いずれか未設定なら接続拒否)
- 型付けされたイベント契約は `shared/events.ts`
- 切断タイムアウトによる強制離脱は非対応(無期限保持)
- 出品者オフラインのままでも進行を自動再開しない(`03_state_flow.md` 参照)
