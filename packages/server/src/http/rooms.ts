import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"
import { generateUuid } from "@bluff-auction/shared"
import { loadRoomState, saveRoomState } from "../db/repository.js"
import { withTx, db } from "../db/client.js"
import { players, rooms } from "../db/schema.js"
import { addPlayer, removePlayer, startGame } from "../gameEngine.js"
import { buildView } from "../viewFilter.js"
import type { EngineEvent } from "../gameEngine.js"

type RoomOpsDeps = {
  broadcastViews: (roomId: string) => Promise<void>
  dispatchEngineEvents: (events: EngineEvent[], roomId: string) => Promise<void>
}

const UUID_REGEX = /^[0-9a-f]{32}$/

// X-Player-Id ヘッダを必須とするルート用のヘルパ
function requirePlayerId(req: FastifyRequest, reply: FastifyReply): string | null {
  const pid = req.headers["x-player-id"]
  if (typeof pid !== "string" || !pid) {
    reply.code(401).send({ code: "unauthorized", message: "X-Player-Id ヘッダが必要" })
    return null
  }
  return pid
}

// :id パスパラメータを正規化(lowercase)+ UUID 形式検証
function resolveRoomIdParam(raw: string, reply: FastifyReply): string | null {
  const normalized = raw.toLowerCase()
  if (!UUID_REGEX.test(normalized)) {
    reply.code(400).send({ code: "bad-room-id", message: "ルーム ID の形式が不正" })
    return null
  }
  return normalized
}

export async function registerRoomRoutes(app: FastifyInstance, deps: RoomOpsDeps): Promise<void> {
  // ルーム作成
  app.post(
    "/rooms",
    {
      schema: {
        tags: ["rooms"],
        summary: "新規ルーム作成(UUID 発行)",
      },
    },
    async (_req, reply) => {
      const id = generateUuid()
      await db.insert(rooms).values({ id })
      reply.code(201).send({ id })
    },
  )

  // ルーム詳細(観戦ビュー: 秘匿情報なし)
  app.get<{ Params: { id: string } }>(
    "/rooms/:id",
    {
      schema: {
        tags: ["rooms"],
        summary: "ルーム詳細(公開情報のみ)",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (req, reply) => {
      const roomId = resolveRoomIdParam(req.params.id, reply)
      if (!roomId) return

      const state = await withTx((tx) => loadRoomState(tx, roomId))
      if (!state) {
        reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
        return
      }
      return buildView(state, null, roomId)
    },
  )

  // ルーム参加
  app.post<{ Params: { id: string } }>(
    "/rooms/:id/players",
    {
      schema: {
        tags: ["rooms"],
        summary: "ルームへ参加",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        headers: {
          type: "object",
          properties: { "x-player-id": { type: "string" } },
          required: ["x-player-id"],
        },
      },
    },
    async (req, reply) => {
      const playerId = requirePlayerId(req, reply)
      if (!playerId) return
      const roomId = resolveRoomIdParam(req.params.id, reply)
      if (!roomId) return

      // players マスターから name を取得
      const [playerRow] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
      if (!playerRow) {
        reply.code(400).send({ code: "no-player", message: "プレイヤー未登録" })
        return
      }

      const result = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = addPlayer(s, playerId, playerRow.name)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const }
        }
        return { kind: "engine-error" as const, code: res.code, message: res.message }
      })

      if (result.kind === "not-found") {
        reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
        return
      }
      if (result.kind === "engine-error") {
        reply.code(400).send({ code: result.code, message: result.message })
        return
      }
      await deps.broadcastViews(roomId)
      reply.code(204).send()
    },
  )

  // ルーム離脱
  app.delete<{ Params: { id: string } }>(
    "/rooms/:id/players/me",
    {
      schema: {
        tags: ["rooms"],
        summary: "ルームから離脱",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        headers: {
          type: "object",
          properties: { "x-player-id": { type: "string" } },
          required: ["x-player-id"],
        },
      },
    },
    async (req, reply) => {
      const playerId = requirePlayerId(req, reply)
      if (!playerId) return
      const roomId = resolveRoomIdParam(req.params.id, reply)
      if (!roomId) return

      const result = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = removePlayer(s, playerId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const }
        }
        return { kind: "engine-error" as const, code: res.code, message: res.message }
      })

      if (result.kind === "not-found") {
        reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
        return
      }
      if (result.kind === "engine-error") {
        reply.code(400).send({ code: result.code, message: result.message })
        return
      }
      await deps.broadcastViews(roomId)
      reply.code(204).send()
    },
  )

  // ゲーム開始(ホストのみ)
  app.post<{ Params: { id: string } }>(
    "/rooms/:id/start",
    {
      schema: {
        tags: ["rooms"],
        summary: "ゲーム開始(ホストのみ)",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        headers: {
          type: "object",
          properties: { "x-player-id": { type: "string" } },
          required: ["x-player-id"],
        },
      },
    },
    async (req, reply) => {
      const playerId = requirePlayerId(req, reply)
      if (!playerId) return
      const roomId = resolveRoomIdParam(req.params.id, reply)
      if (!roomId) return

      const result = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = startGame(s, roomId, playerId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const, events: res.events }
        }
        return { kind: "engine-error" as const, code: res.code, message: res.message }
      })

      if (result.kind === "not-found") {
        reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
        return
      }
      if (result.kind === "engine-error") {
        const status = result.code === "not-host" ? 403 : 400
        reply.code(status).send({ code: result.code, message: result.message })
        return
      }
      await deps.dispatchEngineEvents(result.events, roomId)
      reply.code(204).send()
    },
  )
}
