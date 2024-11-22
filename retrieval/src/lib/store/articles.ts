import { filter, map, mergeMap, bufferTime } from "rxjs/operators";
import { toSql } from "pgvector/pg";
import { Article, EmbeddedArticle } from "../../types/Article";
import { from, pipe } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { sqlClient } from "./db";
import pgformat from "pg-format";
import { v4 } from "uuid";
import { onErrorContinue } from "../utils/reactive";

const hasStoredInDatabase = async (articleSlug: string, feedId: string) => {
  const { rows } = await sqlClient.then((it) =>
    it.query(
      "SELECT slug FROM feed_articles WHERE slug = $1 and feed_id = $2",
      [articleSlug, feedId],
    ),
  );
  return rows && rows.length === 0;
};

export const removeDuplicateArticles$ = onErrorContinue(
  mergeMap((x: Article) =>
    fromPromise(hasStoredInDatabase(x.slug, x.feedId)).pipe(
      filter(Boolean),
      map(() => x),
    ),
  ),
);

export const batchInsertArticlesSql = async (articles: EmbeddedArticle[]) => {
  const params = articles.map((embedded) => [
    v4(),
    embedded.article.title,
    embedded.article.feedId,
    embedded.article.slug,
    embedded.article.description,
    embedded.article.url,
    embedded.article.authors,
    embedded.article.image,
    embedded.article.publishedAt,
    toSql(embedded.embedding),
  ]);

  if (articles.length > 0) {
    const formattedMultiInsert = pgformat(
      `INSERT INTO feed_articles(id, title, feed_id, slug, description, url, author, image, published_at, embedding) VALUES %L ON CONFLICT DO NOTHING`,
      params,
    );

    await sqlClient.then((it) => it.query(formattedMultiInsert));

    const topicLinks = articles.flatMap((it, idx) => {
      const [uuid] = params[idx];
      return it.topics.map((topic) => [topic, uuid]);
    });

    await batchInsertTopicLink(topicLinks);

    return articles;
  }

  return articles;
};

export const batchInsertTopicLink = async (topicLinks: string[][]) => {
  const formattedTopicInsert = pgformat(
    `INSERT INTO feed_article_topic_link(topic_id, feed_article_id) VALUES %L ON CONFLICT DO NOTHING`,
    topicLinks,
  );
  await sqlClient.then((it) => it.query(formattedTopicInsert));
};

export const updateLastUpdatedTime = async (time: Date) => {
  const upsertQuery = `INSERT INTO last_updated_time (id, updated_time)
  VALUES (1, $1)
  ON CONFLICT(id) 
  DO UPDATE SET
    updated_time = EXCLUDED.updated_time;`;
  await sqlClient.then((it) => it.query(upsertQuery, [time]));
};

export const insertArticleToStore$ = pipe(
  bufferTime<EmbeddedArticle>(5000, null, 100),
  onErrorContinue(
    mergeMap((x: EmbeddedArticle[]) => fromPromise(batchInsertArticlesSql(x))),
  ),
  mergeMap((it: EmbeddedArticle[]) => from(it)),
);
