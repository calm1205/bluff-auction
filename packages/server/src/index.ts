import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { Server as SocketServer } from "socket.io";
import type {
  AckResponse,
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from "@bluff-auction/shared";
import {
  bid,
  listCard,
  markOffline,
  pass,
  type EngineEvent,
  type EngineResult,
} from "./gameEngine.js";
import { buildView } from "./viewFilter.js";
import { loadRoomState, saveRoomState } from "./db/repository.js";
import { withTx } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { registerRoomRoutes } from "./http/rooms.js";

const PORT = Number(process.env.PORT ?? 4000);
const DEFAULT_ROOM_ID = "default";

function getUserId(socket: import("socket.io").Socket): string | null {
  return (socket.data.userId as string | undefined) ?? null;
}

async function main() {
  await runMigrations();
  console.log("[server] migrations applied");

  const app = Fastify({ logger: false });

  await app.register(cors, { origin: "*" });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Bluff Auction API",
        description: "ロビー/ルーム管理の REST API。ゲーム進行中のイベントは Socket.IO 参照",
        version: "0.1.0",
      },
      tags: [{ name: "rooms", description: "ルーム管理" }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
  });

  // Socket.IO を同じ HTTP サーバーにアタッチ
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
    cors: { origin: "*" },
  });

  // userId -> socket.id マッピング(再接続時に更新)
  const userSocketMap = new Map<string, string>();

  function broadcastViewsFromState(state: GameState): void {
    for (const sock of io.of("/").sockets.values()) {
      const uid = getUserId(sock);
      sock.emit("view-update", buildView(state, uid));
    }
  }

  async function broadcastViews(roomId: string): Promise<void> {
    const state = await withTx((tx) => loadRoomState(tx, roomId));
    broadcastViewsFromState(state);
  }

  function dispatchEvents(events: EngineEvent[], state: GameState): void {
    for (const ev of events) {
      if (ev.type === "view-update") {
        broadcastViewsFromState(state);
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

  // REST ハンドラから呼ばれる: 該当ルームの state を取得してイベントをディスパッチ
  async function dispatchEngineEvents(events: EngineEvent[], roomId: string): Promise<void> {
    const state = await withTx((tx) => loadRoomState(tx, roomId));
    dispatchEvents(events, state);
  }

  // REST ルート
  await registerRoomRoutes(app, { broadcastViews, dispatchEngineEvents });

  function ackFromResult(result: EngineResult): AckResponse {
    return result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message };
  }

  const dbErrorAck: AckResponse = { ok: false, code: "db-error", message: "DB エラー" };

  // Socket.IO: in-game イベントのみ処理
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
        const s = await loadRoomState(tx, DEFAULT_ROOM_ID);
        const existing = s.players.find((p) => p.id === userId);
        if (existing) {
          existing.online = true;
          await saveRoomState(tx, s, DEFAULT_ROOM_ID);
        }
        return s;
      });
      const existing = state.players.find((p) => p.id === userId);
      if (existing) {
        broadcastViewsFromState(state);
      } else {
        socket.emit("view-update", buildView(state, userId));
      }
    } catch (e) {
      console.error("[server] connection load error", e);
    }

    socket.on("list-card", async ({ cardId, declaredBrand, startingBid }, ack) => {
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx, DEFAULT_ROOM_ID);
          const res = listCard(s, userId, cardId, declaredBrand, startingBid);
          if (res.ok) await saveRoomState(tx, s, DEFAULT_ROOM_ID);
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
          const s = await loadRoomState(tx, DEFAULT_ROOM_ID);
          const res = bid(s, userId, amount);
          if (res.ok) await saveRoomState(tx, s, DEFAULT_ROOM_ID);
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
          const s = await loadRoomState(tx, DEFAULT_ROOM_ID);
          const res = pass(s, userId);
          if (res.ok) await saveRoomState(tx, s, DEFAULT_ROOM_ID);
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
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
      }
      try {
        const { result, state } = await withTx(async (tx) => {
          const s = await loadRoomState(tx, DEFAULT_ROOM_ID);
          const res = markOffline(s, userId);
          if (res.ok) await saveRoomState(tx, s, DEFAULT_ROOM_ID);
          return { result: res, state: s };
        });
        if (result.ok) dispatchEvents(result.events, state);
      } catch (e) {
        console.error("[server] disconnect error", e);
      }
    });
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`[server] Bluff Auction server listening on :${PORT}`);
  console.log(`[server] OpenAPI docs: http://localhost:${PORT}/docs`);
}

main().catch((e) => {
  console.error("[server] fatal startup error", e);
  process.exit(1);
});
