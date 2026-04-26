import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { players } from "../db/schema.js"

function requirePlayerId(req: FastifyRequest, reply: FastifyReply): string | null {
  const pid = req.headers["x-player-id"]
  if (typeof pid !== "string" || !pid) {
    reply.code(401).send({ code: "unauthorized", message: "X-Player-Id ヘッダが必要" })
    return null
  }
  return pid
}

export async function registerPlayerRoutes(app: FastifyInstance): Promise<void> {
  // プレイヤー登録(身元マスターへ INSERT)
  app.post<{ Body: { id: string; name: string } }>(
    "/players",
    {
      schema: {
        tags: ["players"],
        summary: "プレイヤー登録",
        body: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1 },
          },
          required: ["id", "name"],
        },
      },
    },
    async (req, reply) => {
      const { id, name } = req.body
      const [existing] = await db.select().from(players).where(eq(players.id, id)).limit(1)
      if (existing) {
        reply.code(409).send({ code: "player-exists", message: "id は既登録" })
        return
      }
      await db.insert(players).values({ id, name })
      reply.code(201).send()
    },
  )

  // 自分の登録名取得(起動時の整合性チェック用)
  app.get(
    "/players/me",
    {
      schema: {
        tags: ["players"],
        summary: "自分のプレイヤー情報取得",
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

      const [row] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
      if (!row) {
        reply.code(404).send({ code: "not-found", message: "player 未登録" })
        return
      }
      return { playerId: row.id, name: row.name }
    },
  )
}
