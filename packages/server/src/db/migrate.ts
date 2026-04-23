import { migrate } from "drizzle-orm/postgres-js/migrator"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { db } from "./client.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// src/db/migrate.ts からパッケージルートの drizzle ディレクトリを指す
const migrationsFolder = path.resolve(__dirname, "../../drizzle")

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder })
}
