import { mergeMap, Observable } from "rxjs";
import axios from "axios";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { Article } from "../../../../types/Article";
import { converters } from "./rssConverters/converters";
import { filter, finalize } from "rxjs/operators";
import { getRssFeeds$ } from "../../../store/feeds";
import { ContentFeed, Feed } from "../../../../types/Feeds";
import { exponentialBackOff, onErrorContinue } from "../../../utils/reactive";
import { updateLastUpdatedTime } from "../../../store/articles";

const getRssFeed = async (feed: Feed): Promise<ContentFeed | null> => {
  try {
    const rss = await axios.get<string>(feed.link);
    return {
      feed,
      content: rss.data,
    };
  } catch (e) {
    console.error("Error retrieving RSS Feed Content", e);
    throw e;
  }
};

export const rssToArticles = (site: Feed) =>
  fromPromise(getRssFeed(site)).pipe(
    filter((it): it is ContentFeed => !!it),
    mergeMap<ContentFeed, Observable<Article>>((item) =>
      converters.generic(item),
    ),
  );

export const rss$ = (() => {
  let lastUpdatedTime = new Date(0);

  return getRssFeeds$.pipe(
    onErrorContinue(
      mergeMap((it) => rssToArticles(it).pipe(exponentialBackOff(5))),
    ),
    filter((it: Article) => it.publishedAt > lastUpdatedTime),
    finalize(async () => {
      lastUpdatedTime = new Date();
      await updateLastUpdatedTime(lastUpdatedTime);
    }),
  );
})();
