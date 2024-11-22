import { Feed } from "./Feeds";

export type EventType = "POPULATE" | "REFRESH" | "NEW_FEED" | "NEW_TOPIC";

export type EventMessage = {
  eventType?: EventType;
  detail: {
    eventType: EventType;
    feed?: Feed | undefined;
    topicDetails?:
      | { topicId: string; topicExamples: string[]; name: string }
      | undefined;
  };
};
