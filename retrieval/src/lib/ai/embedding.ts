import { mergeMap } from "rxjs/operators";
import { Article, EmbeddedArticle } from "../../types/Article";
import { OperatorFunction, pipe, share } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { client } from "../clients/ai/client";
import { onErrorContinue, rateLimiter } from "../utils/reactive";
import { sqlClient } from "../store/db";
import { toSql } from "pgvector/pg";
import { EmbeddedTopic, Topic } from "../../types/Label";

// Remove, for instance, "The Verge" and " - The Verge" to avoid the cosine similarity matching on that.
const prepareTitle = (article: Article): string =>
  article.title
    .replace(article.site, "")
    .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[]\\\/]/gi, "");

const getEmbeddingForArticle = async (
  it: Article,
): Promise<EmbeddedArticle> => {
  const embedding = await client.getEmbeddings(
    `${prepareTitle(it).toLowerCase()} ${it.description.toLowerCase()}`,
    "search_query",
  );

  return {
    embedding,
    article: it,
    topics: [],
  };
};

const addTopicsToArticle = async (
  it: EmbeddedArticle,
): Promise<EmbeddedArticle> => {
  const articleEmbedding = it.embedding;

  const topics = await sqlClient.then((it) =>
    it.query(
      `SELECT
      name,
      embedding_description,
      similarity
    FROM
        (
              SELECT
                  topic_id as name,
                  embedding_description,
                  1 - ABS(1 - (embed.embedding <-> $1)) AS "similarity"
              FROM
                  topic_embedding_link embed
        )
    topics
    ORDER BY similarity desc`,
      [toSql(articleEmbedding)],
    ),
  );

  // Using the method here we've seen a good deal of confidence around the 0.95 mark.
  const topicNames = topics.rows
    .filter(({ similarity }) => similarity >= 0.95)
    .map(({ name }) => name as string);

  if (topicNames.length == 0) {
    topicNames.push(topics.rows[0]?.name);
  }

  // I want to also check if any are clustered close together. If they are less than 0,95, it is likely
  // the next greatest one. We want to see if they're also clustered together.
  const topTopic = topics.rows[0];
  const extraTopics = topics.rows
    .filter(
      ({ similarity, name }) =>
        !topicNames.includes(name) && topTopic.similarity - similarity <= 0.02,
    )
    .map(({ name }) => name as string);

  topicNames.push(...extraTopics);

  return {
    ...it,
    topics: topicNames,
  };
};

export const getArticlesFromTopic = async (topic: Topic): Promise<string[]> => {
  const feedArticleIdQuery = `
  SELECT
     feed_articles.id as feedId,
     MAX(
          1 - ABS(1 - (feed_articles.embedding <-> te.embedding))
     ) as similarity
  FROM
      feed_articles full
      outer join (
            SELECT
                *
            FROM
                topics
                INNER JOIN topic_embedding_link on topics.id = topic_embedding_link.topic_id
            WHERE
                topics.id = $1
      ) te on 1 = 1
  WHERE
      published_at >= CURRENT_DATE - INTERVAL '10 days'
  GROUP by
      feed_articles.id`;

  const articles = (await sqlClient.then((it) =>
    it.query(feedArticleIdQuery, [topic.id]),
  )) as { rows: { feedid: string; similarity: number }[] };

  return articles.rows
    .filter((it) => it.similarity > 0.95)
    .map((it) => it.feedid);
};

const getEmbeddingForTopic = async (topic: Topic): Promise<EmbeddedTopic> => {
  const embedding = await client.getEmbeddings(
    topic.description.toLowerCase(),
    "search_document",
  );

  return {
    embedding,
    topic,
  };
};

export const rateLimitEmbedding = <T>() =>
  pipe(share(), rateLimiter<T>({ resetLimit: 1000, timeMs: 60_000 }));

export const rateLimiting = rateLimitEmbedding<never>();

export const addEmbeddingToLabel$: OperatorFunction<Topic, EmbeddedTopic> =
  pipe(
    rateLimiting,
    mergeMap((it: Topic) => fromPromise(getEmbeddingForTopic(it))),
  );

export const addEmbeddingToArticle$: OperatorFunction<
  Article,
  EmbeddedArticle
> = pipe(
  rateLimiting,
  onErrorContinue(
    mergeMap((it: Article) => fromPromise(getEmbeddingForArticle(it))),
  ),
);

export const addTopicsToArticle$: OperatorFunction<
  EmbeddedArticle,
  EmbeddedArticle
> = pipe(
  onErrorContinue(
    mergeMap((it: EmbeddedArticle) => fromPromise(addTopicsToArticle(it))),
  ),
);
