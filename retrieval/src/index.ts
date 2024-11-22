import { SQSHandler, SQSEvent } from "aws-lambda";
import { EventMessage } from "./types/EventMessage";
import { refreshRss } from "./refresh";
import { populateNewFeed } from "./newFeed";
import { populateNewTopic } from "./newTopic";

const handler: SQSHandler = async (event: SQSEvent) => {
  const records: EventMessage[] = event.Records.map(
    (it) => JSON.parse(it.body) as EventMessage,
  );

  for (const record of records) {
    switch (record.eventType ?? record.detail.eventType) {
      case "REFRESH":
        await refreshRss();
        break;
      case "NEW_FEED":
        await populateNewFeed(record.detail.feed!);
        break;
      case "NEW_TOPIC":
        await populateNewTopic(
          {
            id: record.detail.topicDetails.topicId,
            name: record.detail.topicDetails.name,
          },
          record.detail.topicDetails.topicExamples,
        );
        break;
      default:
        break;
    }
  }

  return;
};

exports.handler = handler;
