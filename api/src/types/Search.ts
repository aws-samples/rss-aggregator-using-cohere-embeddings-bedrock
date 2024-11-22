import { FeedItem } from "./Item";

export type SearchPostRequest = {
  searchTerm: string;
  feedId?: string;
};

export interface SearchReply {
  200: { search: FeedItem[] };
  "4xx": { error: string };
  500: { error: string };
}
