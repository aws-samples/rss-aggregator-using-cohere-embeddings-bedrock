import { FastifyInstance } from "fastify";
import {
  addFeedSubscription,
  deleteFeed,
  getFeed,
  getRssDetails,
  getRssFeeds,
  updateFeed,
} from "../lib/feeds";
import { Feed, FeedPostRequest, FeedReply } from "../types/Feed";
import {
  FeedValidityCheck,
  FeedValidityCheckRequest,
} from "../types/FeedValidity";
import { ConflictError, InvalidError } from "../types/Errors";
import { HttpStatusCode } from "axios";
import { sendNewFeedEvent } from "../lib/events";

export const addRoutes = (server: FastifyInstance) => {
  server.get<{ Reply: FeedReply }>("/feeds", async (req, reply) => {
    const rows = await getRssFeeds(req.user.id);

    return reply.status(200).send({ feeds: rows });
  });

  server.delete<{ Params: { id: string } }>(
    "/feeds/:id",
    async (req, reply) => {
      const { id } = req.params;
      const feed = await getFeed(id, req.user.id);

      if (!feed) {
        return reply.status(404).send();
      }

      if (feed.user_id != req.user.id) {
        return reply.status(401).send();
      }

      await deleteFeed(feed);

      return reply.status(200).send();
    },
  );

  server.patch<{ Params: { id: string }; Body: Partial<Feed> }>(
    "/feeds/:id",
    async (req, reply) => {
      const { id } = req.params;
      const feed = await getFeed(id, req.user.id);

      if (!feed) {
        return reply.status(404).send();
      }

      if (feed.user_id != req.user.id) {
        return reply.status(401).send();
      }

      const feedUpdate = { ...feed, ...req.body };
      const updatedFeed = await updateFeed(id, req.user.id, feedUpdate);

      return reply.status(200).send(updatedFeed);
    },
  );

  server.post<{ Body: FeedValidityCheckRequest; Reply: FeedValidityCheck }>(
    "/feeds/validate",
    async (req, reply) => {
      const rssDetails = await getRssDetails(req.body.url, req.user.id);

      return reply.status(200).send(rssDetails);
    },
  );

  server.post<{ Body: FeedPostRequest; Reply: { feed: Feed } }>(
    "/feeds",
    async (req, reply) => {
      try {
        const feed = await addFeedSubscription(
          req.body.link,
          req.body.name,
          req.user.id,
        );

        if (feed && !feed.existed) {
          await sendNewFeedEvent(feed);
        }

        const { existed, ...newFeed } = feed;
        return reply.status(200).send({ feed: newFeed });
      } catch (error) {
        if (error instanceof ConflictError) {
          return reply.status(HttpStatusCode.Conflict);
        }

        if (error instanceof InvalidError) {
          return reply.status(HttpStatusCode.BadRequest);
        }

        throw error;
      }
    },
  );
};
