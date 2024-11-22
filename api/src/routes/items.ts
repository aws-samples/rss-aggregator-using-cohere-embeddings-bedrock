import { FastifyInstance } from "fastify";
import { FeedItemQueryString, FeedItemReply } from "../types/Item";
import { getAllTopicsItems, getTopicItems } from "../lib/item";
import { getLastRefreshedTime } from "../lib/feeds";
import { logger } from "../utils/logger";

export const addRoutes = (server: FastifyInstance) => {
  server.get<{ Querystring: FeedItemQueryString; Reply: FeedItemReply }>(
    "/items",
    async (req, reply) => {
      const { topicId, feedId, page, limit } = req.query;
      const numLimit = Number(limit ?? 10);
      const numPage = Number(page ?? 0);

      logger.info(
        `Retrieving items for topic: ${topicId}, and feed :${feedId}`,
      );
      const offset = numPage && numPage > 0 ? numPage * numLimit : 0;
      // We retrieve limit + 1 so we can determine if we have more
      const lastUpdated = getLastRefreshedTime();
      let items;
      if (!topicId) {
        items = await getAllTopicsItems(
          req.user.id,
          offset,
          numLimit + 1,
          feedId,
        );
      } else {
        items = await getTopicItems(
          req.user.id,
          offset,
          numLimit + 1,
          topicId!,
          feedId,
        );
      }

      const expiryDate = new Date((await lastUpdated).getTime() + 3_600_000);
      const expiresIn = Math.max(0, expiryDate.getTime() - Date.now());

      // If there's no feed Id this represents _every_ feed that user has. In that case it will differ between
      // users, so it's best to cache it locally. Otherwise, we should cache on the CDN/API Gateway.
      return reply
        .headers({
          "cache-control": `max-age=${Math.floor(expiresIn / 1000)}, ${feedId ? `public` : "private, no-store"} `,
        })
        .status(200)
        .send({
          items: items.slice(0, limit),
          hasMore: items.length > numLimit,
        });
    },
  );
};
