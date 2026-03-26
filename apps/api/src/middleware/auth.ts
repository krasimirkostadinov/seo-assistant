import type { FastifyReply, FastifyRequest } from "fastify";
import type { Env } from "../env.js";
import { createAuthVerifier } from "../auth/verify.js";

export function createAuthMiddleware(env: Env) {
  const verify = createAuthVerifier(env);

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "unauthorized" });
    }
    try {
      const { sub } = await verify(h.slice(7));
      req.auth = { sub };
    } catch {
      return reply.status(401).send({ error: "unauthorized" });
    }
  };
}
