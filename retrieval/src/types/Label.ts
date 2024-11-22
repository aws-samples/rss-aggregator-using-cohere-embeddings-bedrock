export interface Topic {
  id: string;
  name: string;
  description?: string;
}

export type PredefinedEmbeds = Partial<
  EmbeddedTopic & {
    children?: EmbeddedTopic[];
    parent?: EmbeddedTopic;
  }
>;

export type EmbeddedTopic = {
  embedding: Array<number>;
  topic: Topic;
};
