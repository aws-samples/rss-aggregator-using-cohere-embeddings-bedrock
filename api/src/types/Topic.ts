export type Topic = {
  id: string;
  name: string;
  deletable?: boolean;
  hidden?: boolean;
};

export type TopicResponse = {
  200: { topics: Topic[] };
  "4xx": { error: string };
  500: { error: string };
};

export type AddTopicResponse = {
  200: { topic: Topic };
  "4xx": { error: string };
  500: { error: string };
};

export type AddTopic = {
  name: string;
  related: string[];
};
