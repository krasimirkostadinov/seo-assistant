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
    origin: env.corsOrigins,
    credentials: true,
    allowedHeaders: ["authorization", "content-type"],
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
  });
  await app.register(healthRoutes);
  await app.register(threadRoutes, { prefix: "", env, db });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
