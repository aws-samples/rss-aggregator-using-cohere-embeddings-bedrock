import { FastifyInstance } from "fastify";
import {
  createTopic,
  deleteTopic,
  getTopic,
  getTopics,
  setTopicAsHidden,
} from "../lib/topics";
import {
  AddTopic,
  AddTopicResponse,
  Topic,
  TopicResponse,
} from "../types/Topic";
import { sendNewTopicEvent } from "../lib/events";

export const addRoutes = (server: FastifyInstance) => {
  server.get<{ Reply: TopicResponse }>("/topics", async (req, reply) => {
    const rows = await getTopics(req.user.id);

    return reply.status(200).send({ topics: rows });
  });

  server.delete<{ Params: { id: string } }>(
    "/topics/:id",
    async (req, reply) => {
      const topic = await getTopic(req.params.id, req.user.id);

      if (!topic) {
        return reply.status(404).send({ error: "Topic not found" });
      }

      if (!topic.deletable) {
        return reply.status(403).send({ error: "Topic is not deletable" });
      }

      await deleteTopic(topic);

      return reply.status(200).send();
    },
  );

  server.patch<{ Params: { id: string }; Body: Partial<Topic> }>(
    "/topics/:id",
    async (req, reply) => {
      const { id } = req.params;
      const update = req.body;
      const topic = await getTopic(id, req.user.id);

      if (!topic) {
        return reply.status(404).send({ error: "Topic not found" });
      }

      if (
        update.deletable != undefined &&
        update.deletable != topic.deletable
      ) {
        return reply
          .status(403)
          .send({ error: "Cannot update flag Deletable" });
      }

      if (update.hidden != undefined) {
        await setTopicAsHidden(id, req.user.id, update.hidden);
      }

      return reply.status(200).send({ ...topic, ...update });
    },
  );

  server.post<{ Body: AddTopic; Reply: AddTopicResponse }>(
    "/topics",
    async (req, reply) => {
      // Create topic
      const { name, related } = req.body;
      const topic = await createTopic(name, req.user.id);

      // Send topic to queue for further processing.
      await sendNewTopicEvent(topic, related);

      return reply.status(200).send({ topic });
    },
  );
};
