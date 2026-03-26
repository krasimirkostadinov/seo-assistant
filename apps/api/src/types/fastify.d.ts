import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    auth?: { sub: string };
  }
}
