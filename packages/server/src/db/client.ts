import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 環境変数が未設定");
}

export const pool = postgres(databaseUrl, { max: 10 });
export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}
