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
  // 自分の直近の登録名取得(起動時の整合性チェック用)
  // 過去にルーム参加したことがあれば、該当 players 行から name を返す。
  app.get(
    "/players/me",
    {
      schema: {
        tags: ["players"],
        summary: "自分の直近の登録名取得",
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
