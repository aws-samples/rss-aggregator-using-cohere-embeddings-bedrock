import { FeedItem } from "../types/Item";
import { bedrockClient } from "./bedrock";
import { sqlClient } from "./psql";
import { toSql } from "pgvector/pg";

export const getClosestArticles = async (
  userId: string,
  searchTerm: string,
  feedId: string | null = null,
) => {
  // The articles are stored as search_queries, so it makes sense to consider the embedding as a document.
  const embedding = await bedrockClient.getEmbeddings(
    searchTerm,
    "search_document",
  );
  const query = `
            SELECT id, title, feed, feedName, slug, description, url, author, image, published, similarity
            FROM (
                SELECT feed_articles.id as id, title, feed_articles.feed_id as feed, feedName, slug, description, url, author, image, published_at as published, 1 - ABS(1 - (embedding <-> $2)) AS "similarity"
                FROM feed_articles
                INNER JOIN (select feed_id, name as feedName from feed_user_subscription fus where fus.user_id=$1) sub on feed_articles.feed_id=sub.feed_id
                ${feedId != undefined ? `WHERE feed_articles.feed_id = $4` : ""}
            )
            WHERE similarity > 0.95
            ORDER BY similarity desc
            LIMIT $3; 
          `;

  const params = [userId, toSql(embedding), 30];
  if (feedId) {
    params.push(feedId);
  }

  const { rows } = (await sqlClient.then((it) => it.query(query, params))) as {
    rows: FeedItem[];
  };

  return rows;
};
