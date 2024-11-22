import { FastifyInstance } from "fastify";

export const addCacheMiddleware = (server: FastifyInstance) => {
  server.addHook("preHandler", async (req, reply) => {
    // Add the private cache-control header on all responses, this will be overwritten on the items level.
    reply.header("cache-control", "max-age=0, private, no-store");
  });
};
