import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"
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

// X-Player-Id ヘッダを必須とするルート用のヘルパ
function requirePlayerId(req: FastifyRequest, reply: FastifyReply): string | null {
  const pid = req.headers["x-player-id"]
  if (typeof pid !== "string" || !pid) {
    reply.code(401).send({ code: "unauthorized", message: "X-Player-Id ヘッダが必要" })
    return null
  }
  return pid
}

export async function registerRoomRoutes(app: FastifyInstance, deps: RoomOpsDeps): Promise<void> {
  // ルーム作成
  app.post(
    "/rooms",
    {
      schema: {
        tags: ["rooms"],
        summary: "新規ルーム作成",
        response: {
          201: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
          },
        },
      },
    },
    async (_req, reply) => {
      const id = randomUUID()
      await db.insert(rooms).values({ id })
      reply.code(201).send({ id })
    },
  )

  // ルーム一覧
  app.get(
    "/rooms",
    {
      schema: {
        tags: ["rooms"],
        summary: "ルーム一覧",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                phase: { type: "string" },
                playerCount: { type: "integer" },
              },
              required: ["id", "phase", "playerCount"],
            },
          },
        },
      },
    },
    async () => {
      const roomRows = await db.select().from(rooms)
      const result = await Promise.all(
        roomRows.map(async (r) => {
          const state = await withTx((tx) => loadRoomState(tx, r.id))
          return { id: r.id, phase: state.phase, playerCount: state.players.length }
        }),
      )
      return result
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
      const state = await withTx((tx) => loadRoomState(tx, req.params.id))
      if (state.players.length === 0 && state.phase === "lobby") {
        // 未作成 or 空ルームは存在しないとみなす
        const [exists] = await db.select().from(rooms).where(eq(rooms.id, req.params.id)).limit(1)
        if (!exists) {
          reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
          return
        }
      }
      return buildView(state, null)
    },
  )

  // ルーム参加(ボディ不要、名前は players マスターから取得)
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
      const roomId = req.params.id

      // players マスターから name を取得(未登録なら 400)
      const [playerRow] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
      if (!playerRow) {
        reply.code(400).send({ code: "no-player", message: "プレイヤー未登録" })
        return
      }

      const { ok, code, message } = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        const res = addPlayer(s, playerId, playerRow.name)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { ok: true as const }
        }
        return { ok: false as const, code: res.code, message: res.message }
      })

      if (!ok) {
        reply.code(400).send({ code, message })
        return
      }
      await deps.broadcastViews(roomId)
      reply.code(204).send()
    },
  )

  // ルーム離脱(自身のみ)
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
      const roomId = req.params.id

      const { ok, code, message } = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        const res = removePlayer(s, playerId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { ok: true as const }
        }
        return { ok: false as const, code: res.code, message: res.message }
      })

      if (!ok) {
        reply.code(400).send({ code, message })
        return
      }
      await deps.broadcastViews(roomId)
      reply.code(204).send()
    },
  )

  // ゲーム開始
  app.post<{ Params: { id: string } }>(
    "/rooms/:id/start",
    {
      schema: {
        tags: ["rooms"],
        summary: "ゲーム開始",
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
      const roomId = req.params.id

      const { ok, code, message, events } = await withTx(async (tx) => {
        const s = await loadRoomState(tx, roomId)
        const res = startGame(s, roomId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { ok: true as const, events: res.events }
        }
        return { ok: false as const, code: res.code, message: res.message, events: [] }
      })

      if (!ok) {
        reply.code(400).send({ code, message })
        return
      }
      await deps.dispatchEngineEvents(events, roomId)
      reply.code(204).send()
    },
  )
}
