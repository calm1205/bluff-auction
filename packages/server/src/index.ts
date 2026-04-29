import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { Server as SocketServer } from "socket.io"
import type {
  AckResponse,
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from "@bluff-auction/shared"
import {
  ackReveal,
  bid,
  cpuActOnce,
  findActiveCpu,
  listCard,
  markOffline,
  pass,
  type EngineEvent,
  type EngineResult,
} from "./gameEngine.js"
import { buildView } from "./viewFilter.js"
import { loadRoomState, saveRoomState } from "./db/repository.js"
import { withTx } from "./db/client.js"
import { runMigrations } from "./db/migrate.js"
import { registerRoomRoutes } from "./http/rooms.js"
import { registerPlayerRoutes } from "./http/players.js"

const UUID_REGEX = /^[0-9a-f]{32}$/

const PORT = Number(process.env.PORT ?? 4000)

function getPlayerId(socket: import("socket.io").Socket): string | null {
  return (socket.data.playerId as string | undefined) ?? null
}

function getRoomId(socket: import("socket.io").Socket): string | null {
  return (socket.data.roomId as string | undefined) ?? null
}

async function main() {
  await runMigrations()
  console.log("[server] migrations applied")

  const app = Fastify({ logger: false })

  await app.register(cors, { origin: "*" })

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Bluff Auction API",
        description: "ロビー/ルーム管理の REST API。ゲーム進行中のイベントは Socket.IO 参照",
        version: "0.1.0",
      },
      tags: [
        { name: "players", description: "プレイヤー情報" },
        { name: "rooms", description: "ルーム管理" },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
  })

  // Socket.IO を同じ HTTP サーバーにアタッチ
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
    cors: { origin: "*" },
  })

  // playerId -> socket.id マッピング(再接続時に更新)
  const playerSocketMap = new Map<string, string>()

  function broadcastViewsFromState(state: GameState, roomId: string): void {
    for (const sock of io.of("/").sockets.values()) {
      if (getRoomId(sock) !== roomId) continue
      const pid = getPlayerId(sock)
      sock.emit("view-update", buildView(state, pid, roomId))
    }
  }

  async function broadcastViews(roomId: string): Promise<void> {
    const state = await withTx((tx) => loadRoomState(tx, roomId))
    if (!state) return
    broadcastViewsFromState(state, roomId)
  }

  function dispatchEvents(events: EngineEvent[], state: GameState, roomId: string): void {
    for (const ev of events) {
      if (ev.type === "view-update") {
        broadcastViewsFromState(state, roomId)
      } else if (ev.type === "auction-revealed") {
        const socketId = playerSocketMap.get(ev.to)
        if (socketId) {
          const sock = io.sockets.sockets.get(socketId)
          if (sock && getRoomId(sock) === roomId) {
            io.to(socketId).emit("auction-revealed", { brand: ev.brand })
          }
        }
      } else if (ev.type === "unsold-penalty") {
        io.to(roomId).emit("unsold-penalty", {
          sellerId: ev.sellerId,
          amount: ev.amount,
          recipientIds: ev.recipientIds,
        })
      } else if (ev.type === "game-ended") {
        io.to(roomId).emit("game-ended", { winnerId: ev.winnerId })
      }
    }
  }

  // REST ハンドラから呼ばれる: 該当ルームの state を取得してイベントをディスパッチ
  async function dispatchEngineEvents(events: EngineEvent[], roomId: string): Promise<void> {
    const state = await withTx((tx) => loadRoomState(tx, roomId))
    if (!state) return
    dispatchEvents(events, state, roomId)
  }

  // 現手番が CPU の場合に自動進行(setTimeout で軽くディレイ)
  // すでにスケジュール済みのループとの多重実行を避けるためルーム単位でフラグ管理
  const cpuLoopRunning = new Set<string>()
  function scheduleCpuTurn(roomId: string): void {
    if (cpuLoopRunning.has(roomId)) return
    cpuLoopRunning.add(roomId)
    setTimeout(() => {
      cpuLoopRunning.delete(roomId)
      void runCpuTurn(roomId)
    }, 600)
  }
  async function runCpuTurn(roomId: string): Promise<void> {
    try {
      const result = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        if (!s) return null
        if (!findActiveCpu(s)) return null
        const res = cpuActOnce(s)
        if (res.ok) await saveRoomState(tx, s, roomId)
        return { result: res, state: s }
      })
      if (!result) return
      if (result.result.ok) {
        dispatchEvents(result.result.events, result.state, roomId)
        // 次の手番もまた CPU なら続けて発火
        if (findActiveCpu(result.state)) scheduleCpuTurn(roomId)
      } else {
        console.error("[server] cpu act error", result.result.code, result.result.message)
      }
    } catch (e) {
      console.error("[server] cpu turn error", e)
    }
  }

  // REST ルート
  await registerPlayerRoutes(app)
  await registerRoomRoutes(app, { broadcastViews, dispatchEngineEvents, scheduleCpuTurn })

  function ackFromResult(result: EngineResult): AckResponse {
    return result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message }
  }

  const dbErrorAck: AckResponse = { ok: false, code: "db-error", message: "DB エラー" }

  // Socket.IO: in-game イベントのみ処理
  // クライアントは auth.roomId に UUID(rooms.id)を送る
  io.use(async (socket, next) => {
    const auth = socket.handshake.auth
    const playerId = typeof auth?.playerId === "string" ? auth.playerId : null
    const rawRoomId = typeof auth?.roomId === "string" ? auth.roomId : null
    if (!playerId) return next(new Error("playerId required in auth"))
    if (!rawRoomId) return next(new Error("roomId required in auth"))
    const roomId = rawRoomId.toLowerCase()
    if (!UUID_REGEX.test(roomId)) return next(new Error("invalid roomId"))
    socket.data.playerId = playerId
    socket.data.roomId = roomId
    next()
  })

  io.on("connection", async (socket) => {
    const playerId = getPlayerId(socket)!
    const roomId = getRoomId(socket)!
    console.log(`[server] connected: player=${playerId} room=${roomId} socket=${socket.id}`)
    playerSocketMap.set(playerId, socket.id)
    socket.join(roomId)

    // 既存プレイヤーだった場合はオンラインへ戻す
    try {
      const state = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        if (!s) return null
        const existing = s.players.find((p) => p.id === playerId)
        if (existing) {
          existing.online = true
          await saveRoomState(tx, s, roomId)
        }
        return s
      })
      if (!state) return
      const existing = state.players.find((p) => p.id === playerId)
      if (existing) {
        broadcastViewsFromState(state, roomId)
      } else {
        socket.emit("view-update", buildView(state, playerId, roomId))
      }
    } catch (e) {
      console.error("[server] connection load error", e)
    }

    socket.on("list-card", async ({ cardId, declaredBrand, startingBid }, ack) => {
      try {
        const result = await withTx(async (tx) => {
          const s = await loadRoomState(tx, roomId)
          if (!s) return { kind: "no-room" as const }
          const res = listCard(s, playerId, cardId, declaredBrand, startingBid)
          if (res.ok) await saveRoomState(tx, s, roomId)
          return { kind: "engine" as const, result: res, state: s }
        })
        if (result.kind === "no-room") {
          ack?.({ ok: false, code: "not-found", message: "ルームが存在しない" })
          return
        }
        if (result.result.ok) {
          dispatchEvents(result.result.events, result.state, roomId)
          scheduleCpuTurn(roomId)
        }
        ack?.(ackFromResult(result.result))
      } catch (e) {
        console.error("[server] list-card error", e)
        ack?.(dbErrorAck)
      }
    })

    socket.on("bid", async ({ amount }, ack) => {
      try {
        const result = await withTx(async (tx) => {
          const s = await loadRoomState(tx, roomId)
          if (!s) return { kind: "no-room" as const }
          const res = bid(s, playerId, amount)
          if (res.ok) await saveRoomState(tx, s, roomId)
          return { kind: "engine" as const, result: res, state: s }
        })
        if (result.kind === "no-room") {
          ack?.({ ok: false, code: "not-found", message: "ルームが存在しない" })
          return
        }
        if (result.result.ok) {
          dispatchEvents(result.result.events, result.state, roomId)
          scheduleCpuTurn(roomId)
        }
        ack?.(ackFromResult(result.result))
      } catch (e) {
        console.error("[server] bid error", e)
        ack?.(dbErrorAck)
      }
    })

    socket.on("pass", async (ack) => {
      try {
        const result = await withTx(async (tx) => {
          const s = await loadRoomState(tx, roomId)
          if (!s) return { kind: "no-room" as const }
          const res = pass(s, playerId)
          if (res.ok) await saveRoomState(tx, s, roomId)
          return { kind: "engine" as const, result: res, state: s }
        })
        if (result.kind === "no-room") {
          ack?.({ ok: false, code: "not-found", message: "ルームが存在しない" })
          return
        }
        if (result.result.ok) {
          dispatchEvents(result.result.events, result.state, roomId)
          scheduleCpuTurn(roomId)
        }
        ack?.(ackFromResult(result.result))
      } catch (e) {
        console.error("[server] pass error", e)
        ack?.(dbErrorAck)
      }
    })

    socket.on("ack-reveal", async (ack) => {
      try {
        const result = await withTx(async (tx) => {
          const s = await loadRoomState(tx, roomId)
          if (!s) return { kind: "no-room" as const }
          const res = ackReveal(s, playerId)
          if (res.ok) await saveRoomState(tx, s, roomId)
          return { kind: "engine" as const, result: res, state: s }
        })
        if (result.kind === "no-room") {
          ack?.({ ok: false, code: "not-found", message: "ルームが存在しない" })
          return
        }
        if (result.result.ok) {
          dispatchEvents(result.result.events, result.state, roomId)
          scheduleCpuTurn(roomId)
        }
        ack?.(ackFromResult(result.result))
      } catch (e) {
        console.error("[server] ack-reveal error", e)
        ack?.(dbErrorAck)
      }
    })

    socket.on("disconnect", async () => {
      console.log(`[server] disconnected: player=${playerId} socket=${socket.id}`)
      if (playerSocketMap.get(playerId) === socket.id) {
        playerSocketMap.delete(playerId)
      }
      try {
        const result = await withTx(async (tx) => {
          const s = await loadRoomState(tx, roomId)
          if (!s) return null
          const res = markOffline(s, playerId)
          if (res.ok) await saveRoomState(tx, s, roomId)
          return { result: res, state: s }
        })
        if (result?.result.ok) dispatchEvents(result.result.events, result.state, roomId)
      } catch (e) {
        console.error("[server] disconnect error", e)
      }
    })
  })

  await app.listen({ port: PORT, host: "0.0.0.0" })
  console.log(`[server] Bluff Auction server listening on :${PORT}`)
  console.log(`[server] OpenAPI docs: http://localhost:${PORT}/docs`)
}

main().catch((e) => {
  console.error("[server] fatal startup error", e)
  process.exit(1)
})
