import { rss$ } from "./lib/inputSources/articles/rss/rssIngestor";
import { lastValueFrom } from "rxjs";
import { rssActions } from "./lib/rss";

export const refreshRss = async () => {
  await lastValueFrom(rss$.pipe(rssActions)).catch((e) => {
    if (e.name == "EmptyError") {
      console.log("Nothing to process, exiting..");
      return;
    }
  });
};
