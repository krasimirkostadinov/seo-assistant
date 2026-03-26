import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "../env.js";

export function createAuthVerifier(env: Env) {
  const issuer = `https://${env.AUTH0_DOMAIN}/`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

  return async function verifyToken(token: string) {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: env.AUTH0_AUDIENCE,
      algorithms: ["RS256"],
    });
    const sub = payload.sub;
    if (!sub) {
      throw new Error("missing_sub");
    }
    return { sub };
  };
}
