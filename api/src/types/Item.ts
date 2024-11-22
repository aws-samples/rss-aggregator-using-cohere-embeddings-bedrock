export type FeedItem = {
  id: string;
  feed: string;
  feedName: string;
  title: string;
  url: string;
  author?: string;
  image?: string;
  published?: Date;
  description: string;
};

export type FeedItemQueryString = {
  limit?: number;
  page?: number;
  feedId?: string;
  topicId?: string;
};

export interface FeedItemReply {
  200: { items: FeedItem[]; hasMore: boolean };
  "4xx": { error: string };
  500: { error: string };
}
