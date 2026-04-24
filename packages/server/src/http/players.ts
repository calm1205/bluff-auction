import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { players } from "../db/schema.js"

function requireUserId(req: FastifyRequest, reply: FastifyReply): string | null {
  const uid = req.headers["x-user-id"]
  if (typeof uid !== "string" || !uid) {
    reply.code(401).send({ code: "unauthorized", message: "X-User-Id ヘッダが必要" })
    return null
  }
  return uid
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
          properties: { "x-user-id": { type: "string" } },
          required: ["x-user-id"],
        },
      },
    },
    async (req, reply) => {
      const userId = requireUserId(req, reply)
      if (!userId) return

      const [row] = await db.select().from(players).where(eq(players.userId, userId)).limit(1)
      if (!row) {
        reply.code(404).send({ code: "not-found", message: "player 未登録" })
        return
      }
      return { userId: row.userId, name: row.name }
    },
  )
}
