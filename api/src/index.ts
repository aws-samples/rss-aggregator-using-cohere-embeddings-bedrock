import fastify from "fastify";
import cors from "@fastify/cors";
import * as feeds from "./routes/feeds";
import * as topics from "./routes/topics";
import * as items from "./routes/items";
import * as search from "./routes/search";
import * as auth from "./routes/auth";
import * as cache from "./routes/cache";

export const server = fastify();

server.register(cors, {});

auth.addAuthMiddleware(server);
cache.addCacheMiddleware(server);
feeds.addRoutes(server);
topics.addRoutes(server);
items.addRoutes(server);
search.addRoutes(server);

try {
  server.listen({ port: 8000 });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
