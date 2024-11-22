import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { Feed } from "../types/Feed";
import { Topic } from "../types/Topic";
import { logger } from "../utils/logger";

const eventBridgeClient = new EventBridgeClient();

export const sendNewFeedEvent = async (feed: Feed): Promise<void> => {
  const eventBridgeParams = new PutEventsCommand({
    Entries: [
      {
        Detail: JSON.stringify({ eventType: "NEW_FEED", feed }),
        DetailType: "queueMessage",
        Source: "rssAggregator",
        EventBusName: process.env.EVENTBRIDGE_ARN!,
      },
    ],
  });

  logger.info(`Sending New Feed Message for ${feed.link}`);
  return eventBridgeClient.send(eventBridgeParams).then(() => {});
};

export const sendNewTopicEvent = async (
  topic: Topic,
  related: string[],
): Promise<void> => {
  const eventBridgeParams = new PutEventsCommand({
    Entries: [
      {
        Detail: JSON.stringify({
          eventType: "NEW_TOPIC",
          topicDetails: {
            topicId: topic.id,
            topicExamples: related,
            name: topic.name,
          },
        }),
        DetailType: "queueMessage",
        Source: "rssAggregator",
        EventBusName: process.env.EVENTBRIDGE_ARN!,
      },
    ],
  });

  logger.info(`Sending New Topic Message for ${topic.id}: ${topic.name}`);
  return eventBridgeClient.send(eventBridgeParams).then(() => {});
};
