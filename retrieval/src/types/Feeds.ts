export type Feed = {
  id: string;
  description?: string;
  image?: string;
  link: string;
  title: string;
  type: string;
};

export type ContentFeed = {
  feed: Feed;
  content: string;
};
