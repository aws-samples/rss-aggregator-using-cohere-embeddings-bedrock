export type Feed = {
  id: string;
  title: string;
  link: string;
  description?: string;
  image?: string;
};

export type FeedPostRequest = {
  link: string;
  name: string;
};

export interface FeedReply {
  200: { feeds: Feed[] };
  "4xx": { error: string };
  500: { error: string };
}
