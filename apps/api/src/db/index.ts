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
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
