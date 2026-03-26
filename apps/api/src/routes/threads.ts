import type { FastifyPluginAsync } from "fastify";
import { eq, asc, and } from "drizzle-orm";
import type { Env } from "../env.js";
import type { Db } from "../db/index.js";
import { threads, messages } from "../db/schema.js";
import { runSeoTurn } from "../agent/seo.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { postThreadBody, patchThreadBody, postMessageBody } from "../schemas/thread.schema.js";
import { ensureUser } from "../utils/db.js";
import { toModelMessages } from "../utils/message.js";
import { serializeMetadata, deserializeMetadata } from "../utils/metadata.js";

export const threadRoutes: FastifyPluginAsync<{
  env: Env;
  db: Db;
}> = async (app, opts) => {
  app.addHook("preHandler", createAuthMiddleware(opts.env));

  app.get("/threads", async (req) => {
    const sub = req.auth!.sub;
    await ensureUser(opts.db, sub);
    const list = await opts.db
      .select()
      .from(threads)
      .where(eq(threads.userId, sub))
      .orderBy(asc(threads.createdAt));
    return { threads: list };
  });

  app.patch("/threads/:threadId", async (req, reply) => {
    const sub = req.auth!.sub;
    const { threadId } = req.params as { threadId: string };
    const body = patchThreadBody.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_body" });

    const [th] = await opts.db
      .select()
      .from(threads)
      .where(and(eq(threads.id, threadId), eq(threads.userId, sub)));
    if (!th) return reply.status(404).send({ error: "not_found" });

    await opts.db
      .update(threads)
      .set({ title: body.data.title })
      .where(and(eq(threads.id, threadId), eq(threads.userId, sub)));
    return { thread: { id: threadId, title: body.data.title } };
  });

  app.post("/threads", async (req, reply) => {
    const sub = req.auth!.sub;
    await ensureUser(opts.db, sub);
    const body = postThreadBody.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_body" });

    const id = crypto.randomUUID();
    const title = body.data.title ?? "New chat";
    await opts.db.insert(threads).values({ id, userId: sub, title });
    reply.status(201);
    return { thread: { id, userId: sub, title } };
  });

  app.get("/threads/:threadId/messages", async (req, reply) => {
    const sub = req.auth!.sub;
    const { threadId } = req.params as { threadId: string };

    const [th] = await opts.db
      .select()
      .from(threads)
      .where(and(eq(threads.id, threadId), eq(threads.userId, sub)));
    if (!th) return reply.status(404).send({ error: "not_found" });

    const list = await opts.db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));

    return {
      messages: list.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: deserializeMetadata(m.metadata),
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });

  app.post("/threads/:threadId/messages", async (req, reply) => {
    const sub = req.auth!.sub;
    await ensureUser(opts.db, sub);
    const { threadId } = req.params as { threadId: string };
    const body = postMessageBody.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_body" });

    const [th] = await opts.db
      .select()
      .from(threads)
      .where(and(eq(threads.id, threadId), eq(threads.userId, sub)));
    if (!th) return reply.status(404).send({ error: "not_found" });

    // Fetch history before inserting so the new message isn't orphaned on AI failure
    const historyRows = await opts.db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));

    const modelMessages = [
      ...toModelMessages(historyRows),
      { role: "user" as const, content: body.data.content },
    ];

    let output: Awaited<ReturnType<typeof runSeoTurn>>;
    try {
      output = await runSeoTurn(opts.env, modelMessages);
    } catch (err) {
      req.log.error(
        { err, threadId, model: opts.env.OPENAI_MODEL },
        "runSeoTurn failed",
      );
      const detail =
        process.env.NODE_ENV !== "production" && err instanceof Error
          ? err.message
          : undefined;
      return reply.status(502).send({ error: "agent_failed", ...(detail ? { detail } : {}) });
    }

    const userMsgId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();

    await opts.db.transaction(async (tx: typeof opts.db) => {
      await tx.insert(messages).values({
        id: userMsgId,
        threadId,
        role: "user",
        content: body.data.content,
      });
      await tx.insert(messages).values({
        id: assistantId,
        threadId,
        role: "assistant",
        content: output.message,
        metadata: serializeMetadata(output.suggestions ? { suggestions: output.suggestions } : undefined),
      });
    });

    return {
      userMessage: { id: userMsgId, role: "user" as const, content: body.data.content },
      assistantMessage: {
        id: assistantId,
        role: "assistant" as const,
        content: output.message,
        metadata: output.suggestions ? { suggestions: output.suggestions } : null,
      },
    };
  });
};
