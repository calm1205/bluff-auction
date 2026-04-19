import { Server } from "socket.io";
import type {
  AckResponse,
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from "@bluff-auction/shared";
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
import { loadRoomState, saveRoomState } from "./db/repository.js";
import { withTx } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";

const PORT = Number(process.env.PORT ?? 4000);

function getUserId(socket: import("socket.io").Socket): string | null {
  return (socket.data.userId as string | undefined) ?? null;
}

async function main() {
  await runMigrations();
  console.log("[server] migrations applied");

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(PORT, {
    cors: { origin: "*" },
  });

  // userId -> socket.id の最新マッピング(再接続時に更新)
  const userSocketMap = new Map<string, string>();

  function broadcastViews(state: GameState): void {
    for (const sock of io.of("/").sockets.values()) {
      const uid = getUserId(sock);
      sock.emit("view-update", buildView(state, uid));
    }
  }

  function dispatchEvents(events: EngineEvent[], state: GameState): void {
    for (const ev of events) {
      if (ev.type === "view-update") {
        broadcastViews(state);
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

  const dbErrorAck: AckResponse = { ok: false, code: "db-error", message: "DB エラー" };

  io.use((socket, next) => {
    const auth = socket.handshake.auth;
    const userId = typeof auth?.userId === "string" ? auth.userId : null;
    if (!userId) return next(new Error("userId required in auth"));
    socket.data.userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = getUserId(socket)!;
    console.log(`[server] connected: user=${userId} socket=${socket.id}`);
    userSocketMap.set(userId, socket.id);

    // 既存プレイヤーだった場合はオンラインへ戻す
    try {
      const state = await withTx(async (tx) => {
        const s = await loadRoomState(tx);
        const existing = s.players.find((p) => p.id === userId);
        if (existing) {
          existing.online = true;
          await saveRoomState(tx, s);
        }
        return s;
      });
      const existing = state.players.find((p) => p.id === userId);
      if (existing) {
        broadcastViews(state);
      } else {
        // 初回接続 or ゲーム未参加は最新ビューだけ送る
        socket.emit("view-update", buildView(state, userId));
      }
    } catch (e) {
      console.error("[server] connection load error", e);
    }

    socket.on("join-room", async ({ name }, ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = addPlayer(s, userId, name);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
        ack?.(ackFromResult(result));
      } catch (e) {
        console.error("[server] join-room error", e);
        ack?.(dbErrorAck);
      }
    });

    socket.on("leave-room", async () => {
      try {
        const state = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          removePlayer(s, userId);
          await saveRoomState(tx, s);
          return s;
        });
        broadcastViews(state);
      } catch (e) {
        console.error("[server] leave-room error", e);
      }
    });

    socket.on("start-game", async (ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = startGame(s);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
        ack?.(ackFromResult(result));
      } catch (e) {
        console.error("[server] start-game error", e);
        ack?.(dbErrorAck);
      }
    });

    socket.on("list-card", async ({ cardId, declaredBrand, startingBid }, ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = listCard(s, userId, cardId, declaredBrand, startingBid);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
        ack?.(ackFromResult(result));
      } catch (e) {
        console.error("[server] list-card error", e);
        ack?.(dbErrorAck);
      }
    });

    socket.on("bid", async ({ amount }, ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = bid(s, userId, amount);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
        ack?.(ackFromResult(result));
      } catch (e) {
        console.error("[server] bid error", e);
        ack?.(dbErrorAck);
      }
    });

    socket.on("pass", async (ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = pass(s, userId);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
        ack?.(ackFromResult(result));
      } catch (e) {
        console.error("[server] pass error", e);
        ack?.(dbErrorAck);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`[server] disconnected: user=${userId} socket=${socket.id}`);
      // 最新の socketId が自分と一致する時だけ map から削除(再接続で別socketが上書きしている可能性あり)
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
      }
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx);
          const res = markOffline(s, userId);
          if (res.ok) await saveRoomState(tx, s);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
      } catch (e) {
        console.error("[server] disconnect error", e);
      }
    });
  });

  console.log(`[server] Bluff Auction server listening on :${PORT}`);
}

main().catch((e) => {
  console.error("[server] fatal startup error", e);
  process.exit(1);
});
