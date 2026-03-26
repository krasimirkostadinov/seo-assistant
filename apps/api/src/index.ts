import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./env.js";
import { createDb } from "./db/index.js";
import { healthRoutes } from "./routes/health.js";
import { threadRoutes } from "./routes/threads.js";

function ensureSqliteDir(databaseUrl: string) {
  const path = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl;
  mkdirSync(dirname(path), { recursive: true });
}

async function main() {
  const env = loadEnv();
  ensureSqliteDir(env.DATABASE_URL);
  const db = createDb(env);

  const app = Fastify({ logger: true });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "OPTIONS"],
  });
  await app.register(healthRoutes);
  await app.register(threadRoutes, { prefix: "", env, db });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
