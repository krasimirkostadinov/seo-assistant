import type { Db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function ensureUser(db: Db, sub: string): Promise<void> {
  await db.insert(users).values({ id: sub }).onConflictDoNothing().run();
}
