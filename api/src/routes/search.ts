import { FastifyInstance } from "fastify";
import { getClosestArticles } from "../lib/search";
import { SearchPostRequest, SearchReply } from "../types/Search";

export const addRoutes = (server: FastifyInstance) => {
  server.post<{ Body: SearchPostRequest; Reply: SearchReply }>(
    "/search",
    async (req, reply) => {
      const closestArticles = await getClosestArticles(
        req.user.id,
        req.body.searchTerm,
      );

      // Then we return the items, limit 30.
      return reply.status(200).send({ search: closestArticles });
    },
  );
};
