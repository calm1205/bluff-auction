# 06. プレイヤー認証

クライアント/サーバー間のプレイヤー識別と認証の全体像。

## 概要

- **テーブル設計**: 身元マスター `players` と参加状態 `room_players` を分離
  - `players` (id PK / name / created_at): プレイヤー登録時に作成
  - `room_players` (room_id PK / player_id PK + ゲーム状態): ルーム参加時に作成
- **認証強度**: プロトタイプ向けに UUID のみで識別(トークンやパスワードなし、なりすまし可能)
- **スコープ**: 友人内プレイ想定、本格認証は範囲外

## 識別子の生成とライフサイクル

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant LS as localStorage
    participant S as サーバー
    participant DB as Postgres

    Note over B: 初回アクセス
    B->>LS: getStoredPlayerId() → null
    Note over B: NameRegister 画面を表示
    B->>B: crypto.randomUUID() で生成
    B->>S: POST /players<br/>{ id, name }
    S->>DB: INSERT INTO players (id, name)
    S-->>B: 201 Created
    B->>LS: setStoredPlayerId(id)
    Note over B: 以降、全ての REST/Socket.IO 通信で同じ UUID を送信

    Note over B: ルーム参加時
    B->>S: POST /rooms/:id/players<br/>Header: X-Player-Id<br/>(Body なし)
    S->>DB: SELECT name FROM players WHERE id = <uuid>
    S->>DB: INSERT INTO room_players (room_id, player_id, ...)

    Note over B: 再起動 / 別タブ
    B->>LS: getStoredPlayerId() → <uuid>
    B->>S: GET /players/me<br/>X-Player-Id: <uuid>
    S->>DB: SELECT * FROM players WHERE id = <uuid>
    alt 登録あり
        DB-->>S: 該当行
        S-->>B: 200 { playerId, name }
    else 登録なし(DB リセット等)
        DB-->>S: なし
        S-->>B: 404 not-found
        Note over B: localStorage を削除して登録画面へ
    end
```

## localStorage

| key | value | 用途 |
|---|---|---|
| `bluff-auction.playerId` | UUID 文字列 | プレイヤー識別子 |

- 未保存 → 登録画面
- 保存済 → 起動時に `GET /players/me` で検証
- 表示名は localStorage に保存せず、Zustand store でメモリ保持

## REST 通信

### ヘッダ

| ヘッダ | 値 | 必須化 |
|---|---|---|
| `X-Player-Id` | localStorage の UUID | ルーム参加/離脱/開始・自分情報取得で必須 |

欠落すると 401 `{ code: "unauthorized", message: "X-Player-Id ヘッダが必要" }` を返す。

### 未登録時の挙動

- クライアントは `getStoredPlayerId()` が null の間は `X-Player-Id` を付与しない
- ルーム参加系は 401 になるため、そもそも未登録で呼び出さない UI 設計
- `GET /rooms` のような認証不要エンドポイントは未登録でも呼べる
- `POST /players` は登録自体が目的なのでヘッダ不要

## Socket.IO 通信

### handshake

```ts
io(SERVER_URL, { auth: { playerId, roomId } })
```

- サーバー側 `io.use` ミドルウェアで `playerId` と `roomId` の両方を検証
- いずれか欠落で `next(new Error(...))` により接続拒否
- `socket.data.playerId` / `socket.data.roomId` に保持、以降のイベントハンドラで参照

### ルーム単位の隔離

- `socket.join(roomId)` でルームにバインド、`io.to(roomId).emit(...)` で対象ルームのみへブロードキャスト
- `auction-revealed` は `playerSocketMap.get(playerId)` で該当 socket を特定し、個別 emit

## 登録フロー詳細

### 初回登録

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as NameRegister
    participant LS as localStorage
    participant Store as Zustand store
    participant S as サーバー
    participant DB as Postgres

    U->>UI: 名前入力 → 開始
    UI->>UI: crypto.randomUUID()
    UI->>S: POST /players { id, name }
    S->>DB: INSERT INTO players
    DB-->>S: ok
    S-->>UI: 201
    UI->>LS: setStoredPlayerId(id)
    UI->>Store: setUserName(name)
    UI->>U: ルーム一覧画面へ遷移
```

### 起動時の整合性チェック

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant LS as localStorage
    participant S as サーバー

    B->>LS: getStoredPlayerId()
    alt null
        B->>B: NameRegister 画面
    else UUID あり
        B->>S: GET /players/me<br/>X-Player-Id: <uuid>
        alt 200
            S-->>B: { playerId, name }
            B->>B: Zustand に name 反映 → RoomList へ
        else 404
            S-->>B: not-found
            B->>B: localStorage 削除<br/>→ NameRegister 画面
        else ネットワークエラー
            B->>B: エラー表示 + 再試行ボタン
        end
    end
```

### ルーム参加フロー

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant S as サーバー
    participant DB as Postgres

    B->>S: POST /rooms/:id/players<br/>X-Player-Id(ボディなし)
    S->>DB: SELECT name FROM players WHERE id = <uuid>
    alt players 行なし
        S-->>B: 400 no-player
    else あり
        DB-->>S: { name }
        S->>DB: INSERT INTO room_players (room_id, player_id, ...)
        S-->>B: 204 No Content
        S->>S: Socket.IO で view-update ブロードキャスト
    end
```

## 再接続時

- Socket.IO 切断 → 再接続すると handshake の `auth.playerId` で同一プレイヤーとして復帰
- サーバー側は `room_players.online = true` に戻し、`broadcastViewsFromState` で最新状態を再配信
- ゲーム進行中に席を失うことはない(切断タイムアウトによる強制離脱は非対応)

## 制約

- **なりすまし**: UUID さえ知れば誰でも他人になれる。本番利用では認証強化必須
- **マルチデバイス不可**: 同一 UUID で同時接続すると `playerSocketMap` が上書きされ最新 socket のみ有効
- **DB リセット耐性**: `players` テーブルがリセットされると全 UUID が 404、登録画面で再入力
