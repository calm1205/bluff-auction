import type { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { users } from "../db/schema.js"

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
  // ユーザー登録
  app.post<{ Body: { id: string; name: string } }>(
    "/users",
    {
      schema: {
        tags: ["users"],
        summary: "ユーザー登録",
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
      const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
      if (existing) {
        reply.code(409).send({ code: "user-exists", message: "id は既登録" })
        return
      }
      await db.insert(users).values({ id, name })
      reply.code(201).send()
    },
  )

  // ユーザー存在確認 + 表示名取得
  app.get<{ Params: { id: string } }>(
    "/users/:id",
    {
      schema: {
        tags: ["users"],
        summary: "ユーザー情報取得",
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (req, reply) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1)
      if (!user) {
        reply.code(404).send({ code: "not-found", message: "ユーザー未登録" })
        return
      }
      return { id: user.id, name: user.name }
    },
  )
}
