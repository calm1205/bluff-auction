import { Server } from "socket.io";
import type {
  AckResponse,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@bluff-auction/shared";
import { RoomManager } from "./roomManager.js";
import {
  addPlayer,
  bid,
  listCard,
  markOffline,
  pass,
  removePlayer,
  startGame,
  type EngineEvent,
  type EngineResult,
} from "./gameEngine.js";
import { buildView } from "./viewFilter.js";

const PORT = Number(process.env.PORT ?? 4000);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(PORT, {
  cors: { origin: "*" },
});

const room = new RoomManager();

// userId -> socket.id の最新マッピング(再接続時に更新)
const userSocketMap = new Map<string, string>();

function getUserId(socket: import("socket.io").Socket): string | null {
  return (socket.data.userId as string | undefined) ?? null;
}

function broadcastViews(): void {
  const state = room.getState();
  for (const sock of io.of("/").sockets.values()) {
    const uid = getUserId(sock);
    sock.emit("view-update", buildView(state, uid));
  }
}

function dispatchEvents(events: EngineEvent[]): void {
  for (const ev of events) {
    if (ev.type === "view-update") {
      broadcastViews();
    } else if (ev.type === "auction-revealed") {
      const socketId = userSocketMap.get(ev.to);
      if (socketId) {
        io.to(socketId).emit("auction-revealed", { brand: ev.brand });
      }
    } else if (ev.type === "unsold-penalty") {
      io.emit("unsold-penalty", {
        sellerId: ev.sellerId,
        amount: ev.amount,
        recipientIds: ev.recipientIds,
      });
    } else if (ev.type === "game-ended") {
      io.emit("game-ended", { winnerId: ev.winnerId });
    }
  }
}

function ackFromResult(result: EngineResult): AckResponse {
  return result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message };
}

io.use((socket, next) => {
  const auth = socket.handshake.auth;
  const userId = typeof auth?.userId === "string" ? auth.userId : null;
  if (!userId) return next(new Error("userId required in auth"));
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  const userId = getUserId(socket)!;
  console.log(`[server] connected: user=${userId} socket=${socket.id}`);
  userSocketMap.set(userId, socket.id);

  // 既存プレイヤーだった場合はオンラインへ戻す
  const initialState = room.getState();
  const existing = initialState.players.find((p) => p.id === userId);
  if (existing) {
    existing.online = true;
    broadcastViews();
  } else {
    // 初回接続 or ゲーム未参加は最新ビューだけ送る
    socket.emit("view-update", buildView(initialState, userId));
  }

  socket.on("join-room", ({ name }, ack) => {
    const state = room.getState();
    const result = addPlayer(state, userId, name);
    if (result.ok) dispatchEvents(result.events);
    ack?.(ackFromResult(result));
  });

  socket.on("leave-room", () => {
    const state = room.getState();
    removePlayer(state, userId);
    broadcastViews();
  });

  socket.on("start-game", (ack) => {
    const state = room.getState();
    const result = startGame(state);
    if (result.ok) dispatchEvents(result.events);
    ack?.(ackFromResult(result));
  });

  socket.on("list-card", ({ cardId, declaredBrand, startingBid }, ack) => {
    const state = room.getState();
    const result = listCard(state, userId, cardId, declaredBrand, startingBid);
    if (result.ok) dispatchEvents(result.events);
    ack?.(ackFromResult(result));
  });

  socket.on("bid", ({ amount }, ack) => {
    const state = room.getState();
    const result = bid(state, userId, amount);
    if (result.ok) dispatchEvents(result.events);
    ack?.(ackFromResult(result));
  });

  socket.on("pass", (ack) => {
    const state = room.getState();
    const result = pass(state, userId);
    if (result.ok) dispatchEvents(result.events);
    ack?.(ackFromResult(result));
  });

  socket.on("disconnect", () => {
    console.log(`[server] disconnected: user=${userId} socket=${socket.id}`);
    // 最新の socketId が自分と一致する時だけ map から削除(再接続で別socketが上書きしている可能性あり)
    if (userSocketMap.get(userId) === socket.id) {
      userSocketMap.delete(userId);
    }
    const state = room.getState();
    const result = markOffline(state, userId);
    if (result.ok) dispatchEvents(result.events);
  });
});

console.log(`[server] Bluff Auction server listening on :${PORT}`);
