import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"
import { generateUuid } from "@bluff-auction/shared"
import { loadRoomState, resolveRoomIdByPassphrase, saveRoomState } from "../db/repository.js"
import { withTx, db } from "../db/client.js"
import { players, rooms } from "../db/schema.js"
import { addPlayer, removePlayer, startGame } from "../gameEngine.js"
import { buildView } from "../viewFilter.js"
import type { EngineEvent } from "../gameEngine.js"
import { generatePassphrase, isValidPassphrase, normalizePassphrase } from "../passphrase.js"

type RoomOpsDeps = {
  broadcastViews: (roomId: string) => Promise<void>
  dispatchEngineEvents: (events: EngineEvent[], roomId: string) => Promise<void>
}

const PASSPHRASE_GENERATION_RETRIES = 10

// X-Player-Id ヘッダを必須とするルート用のヘルパ
function requirePlayerId(req: FastifyRequest, reply: FastifyReply): string | null {
  const pid = req.headers["x-player-id"]
  if (typeof pid !== "string" || !pid) {
    reply.code(401).send({ code: "unauthorized", message: "X-Player-Id ヘッダが必要" })
    return null
  }
  return pid
}

// パス param の合言葉を正規化 + 形式検証して返す。不正なら 400 を送出して null を返す
function resolvePassphraseParam(raw: string, reply: FastifyReply): string | null {
  const normalized = normalizePassphrase(raw)
  if (!isValidPassphrase(normalized)) {
    reply.code(400).send({ code: "bad-passphrase", message: "合言葉の形式が不正" })
    return null
  }
  return normalized
}

export async function registerRoomRoutes(app: FastifyInstance, deps: RoomOpsDeps): Promise<void> {
  // ルーム作成 — UUID(rooms.id)+ 合言葉(rooms.passphrase)を発行、衝突は再試行
  app.post(
    "/rooms",
    {
      schema: {
        tags: ["rooms"],
        summary: "新規ルーム作成(UUID + 合言葉発行)",
      },
    },
    async (_req, reply) => {
      for (let i = 0; i < PASSPHRASE_GENERATION_RETRIES; i++) {
        const passphrase = generatePassphrase()
        const [exists] = await db
          .select({ id: rooms.id })
          .from(rooms)
          .where(eq(rooms.passphrase, passphrase))
          .limit(1)
        if (exists) continue
        const id = generateUuid()
        await db.insert(rooms).values({ id, passphrase })
        reply.code(201).send({ id, passphrase })
        return
      }
      reply
        .code(503)
        .send({ code: "passphrase-exhausted", message: "合言葉生成の再試行が上限に達した" })
    },
  )

  // ルーム詳細(観戦ビュー: 秘匿情報なし) — :id は合言葉
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
      const passphrase = resolvePassphraseParam(req.params.id, reply)
      if (!passphrase) return

      const state = await withTx(async (tx) => {
        const roomId = await resolveRoomIdByPassphrase(tx, passphrase)
        if (!roomId) return null
        return loadRoomState(tx, roomId)
      })
      if (!state) {
        reply.code(404).send({ code: "not-found", message: "ルームが存在しない" })
        return
      }
      return buildView(state, null)
    },
  )

  // ルーム参加(ボディ不要、名前は players マスターから取得) — :id は合言葉
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
      const passphrase = resolvePassphraseParam(req.params.id, reply)
      if (!passphrase) return

      // players マスターから name を取得(未登録なら 400)
      const [playerRow] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
      if (!playerRow) {
        reply.code(400).send({ code: "no-player", message: "プレイヤー未登録" })
        return
      }

      const result = await withTx(async (tx) => {
        const roomId = await resolveRoomIdByPassphrase(tx, passphrase)
        if (!roomId) {
          return { kind: "not-found" as const }
        }
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = addPlayer(s, playerId, playerRow.name)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const, roomId }
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
      await deps.broadcastViews(result.roomId)
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
      const passphrase = resolvePassphraseParam(req.params.id, reply)
      if (!passphrase) return

      const result = await withTx(async (tx) => {
        const roomId = await resolveRoomIdByPassphrase(tx, passphrase)
        if (!roomId) return { kind: "not-found" as const }
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = removePlayer(s, playerId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const, roomId }
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
      await deps.broadcastViews(result.roomId)
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
      const passphrase = resolvePassphraseParam(req.params.id, reply)
      if (!passphrase) return

      const result = await withTx(async (tx) => {
        const roomId = await resolveRoomIdByPassphrase(tx, passphrase)
        if (!roomId) return { kind: "not-found" as const }
        const s = await loadRoomState(tx, roomId)
        if (!s) return { kind: "not-found" as const }
        const res = startGame(s, roomId, playerId)
        if (res.ok) {
          await saveRoomState(tx, s, roomId)
          return { kind: "ok" as const, roomId, events: res.events }
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
      await deps.dispatchEngineEvents(result.events, result.roomId)
      reply.code(204).send()
    },
  )
}
