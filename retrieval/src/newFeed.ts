import { lastValueFrom } from "rxjs";
import { rssActions } from "./lib/rss";
import { Feed } from "./types/Feeds";
import { rssToArticles } from "./lib/inputSources/articles/rss/rssIngestor";

export const populateNewFeed = (feed: Feed) =>
  lastValueFrom(rssToArticles(feed).pipe(rssActions)).catch((e) => {
    if (e.name == "EmptyError") {
      console.log("Nothing to process, exiting..");
      return;
    }
  });
