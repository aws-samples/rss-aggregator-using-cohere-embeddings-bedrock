import { FeedItem } from "../types/Item";
import { sqlClient } from "./psql";

export const getAllTopicsItems = async (
  userId: string,
  offset: number = 0,
  amt: number = 10,
  feedId: string | undefined = undefined,
) => {
  const query = `
        SELECT feed_articles.id, title, feed_articles.feed_id as feed, feedName, slug, description, url, author, image, published_at as published
        FROM feed_articles 
        INNER JOIN (select feed_id, name as feedName from feed_user_subscription fus where fus.user_id=$1) sub on feed_articles.feed_id=sub.feed_id
        ${feedId != undefined ? `WHERE feed_articles.feed_id = $4` : ""}
        ORDER BY published_at DESC
        LIMIT $2 OFFSET $3
        `;
  const params = [userId, amt, offset];
  if (feedId) {
    params.push(feedId);
  }

  const { rows } = (await sqlClient.then((it) => it.query(query, params))) as {
    rows: FeedItem[];
  };

  return rows;
};

export const getTopicItems = async (
  userId: string,
  after: number = 0,
  amt: number = 10,
  topicId: string,
  feedId: string | null = null,
) => {
  const query = `
        SELECT feed_articles.id, title, feed_articles.feed_id as feed, feedName, slug, description, url, author, image, published_at as published
        FROM feed_articles
        INNER JOIN (SELECT feed_article_id FROM feed_article_topic_link WHERE topic_id=$2) topic on topic.feed_article_id=id
        INNER JOIN (select feed_id, name as feedName from feed_user_subscription fus where fus.user_id=$1) sub on feed_articles.feed_id=sub.feed_id
        ${feedId != undefined ? `WHERE feed_articles.feed_id = $5` : ""}
        ORDER BY published_at DESC
        LIMIT $3 OFFSET $4
        `;

  const params = [userId, topicId, amt, after];
  if (feedId) {
    params.push(feedId);
  }
  const { rows } = (await sqlClient.then((it) => it.query(query, params))) as {
    rows: FeedItem[];
  };

  return rows;
};
