import { Topic } from "../types/Topic";
import { sqlClient } from "./psql";

export const getTopics = async (userId: string): Promise<Topic[]> => {
  const topicQuery = `
        SELECT id, name, position, deletable, hidden FROM topics
        INNER JOIN user_topic_link ON user_topic_link.topic_id = topics.id
        WHERE user_topic_link.user_id = $1
        ORDER by position ASC
    `;
  const { rows } = (await sqlClient.then((it) =>
    it.query(topicQuery, [userId]),
  )) as { rows: Topic[] };

  return rows;
};

export const getTopic = async (
  id: string,
  userId: string,
): Promise<Topic | null> => {
  const topicQuery = `
    SELECT id, name, position, deletable, hidden FROM topics
    INNER JOIN user_topic_link ON user_topic_link.topic_id = topics.id
    WHERE user_topic_link.user_id = $1 AND id = $2
  `;
  const { rows } = (await sqlClient.then((it) =>
    it.query(topicQuery, [userId, id]),
  )) as { rows: Topic[] };

  return rows[0] ?? null;
};

export const deleteTopic = async ({ id }: Topic) => {
  await sqlClient.then((it) =>
    it.query(`DELETE from topics WHERE id = $1`, [id]),
  );
};

export const setTopicAsHidden = async (
  id: string,
  userId: string,
  hidden: boolean,
) => {
  await sqlClient.then((it) =>
    it.query(
      `UPDATE user_topic_link SET hidden = $1 WHERE user_id = $2 and topic_id = $3`,
      [hidden, userId, id],
    ),
  );
};

export const createTopic = async (
  topicName: string,
  userId: string,
): Promise<Topic> => {
  const query = `INSERT INTO topics (name, deletable) VALUES($1, $2) returning *`;
  const { rows } = (await sqlClient.then((it) =>
    it.query(query, [topicName, true]),
  )) as {
    rows: Topic[];
  };
  const topic = rows[0];

  const insertToUsers = `INSERT INTO user_topic_link (user_id, topic_id) VALUES($1, $2)`;
  await sqlClient.then((it) => it.query(insertToUsers, [userId, topic.id]));

  return rows[0];
};
