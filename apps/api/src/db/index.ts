import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import type { Env } from "../env.js";

function toFilePath(databaseUrl: string): string {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length);
  }
  return databaseUrl;
}

export function createDb(env: Env) {
  const path = toFilePath(env.DATABASE_URL);
  const sqlite = new Database(path);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
