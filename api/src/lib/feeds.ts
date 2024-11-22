import { Feed } from "../types/Feed";
import { sqlClient } from "./psql";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import { FeedValidityCheck } from "../types/FeedValidity";
import { ConflictError, InvalidError } from "../types/Errors";
import { logger } from "../utils/logger";

type SubscribedFeed = Feed & { subscribed: boolean };

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  ignoreDeclaration: false,
  ignorePiTags: false,
});

export const RSS_PARSER_CONFIG = {
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    Accept:
      "application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4, text/html;q=0.2",
  },
};

const checkIsValidXml = (parsedFeed: Record<string, string>) => {
  return parsedFeed?.rss || parsedFeed["rdf:RDF"] || parsedFeed["feed"];
};

const checkIsXml = (contentType: string) => {
  return (
    contentType?.includes("text/rss+xml") ||
    contentType?.includes("text/atom+xml") ||
    contentType?.includes("application/xml") ||
    contentType?.includes("text/xml")
  );
};

const getFeedFromLink = async (
  url: string,
  userId: string,
): Promise<SubscribedFeed | null> => {
  logger.info(`retrieving ${url} feed`);
  const query = `
    SELECT feed.id as id, name as title, link, (CASE WHEN feed_id is not null THEN true ELSE false END) as subscribed FROM feed
    LEFT JOIN (SELECT feed_id, name, created_at FROM feed_user_subscription fus WHERE fus.user_id = $1) subs on subs.feed_id=feed.id
    WHERE link = $2
    ORDER by subs.created_at DESC
    `;

  const { rows } = (await sqlClient.then((it) =>
    it.query(query, [userId, url]),
  )) as {
    rows: (Feed & { subscribed: boolean })[];
  };

  return rows.length === 1 ? rows[0] : null;
};

export const getRssDetails = async (
  link: string,
  userId: string,
  checkExisting: boolean = true,
): Promise<FeedValidityCheck> => {
  logger.info(`Validating feed ${link}`);
  try {
    if (checkExisting) {
      const existingFeed = await getFeedFromLink(link, userId);
      if (existingFeed && existingFeed.subscribed) {
        logger.debug(`Already subscribed to ${link} - ${existingFeed.title}`);
        return {
          isValid: false,
          reason: `Already subscribed to ${link} - ${existingFeed.title}`,
        };
      }
    }

    const response = await axios.get(link);
    const content = response.data;

    const contentType = response.headers["content-type"];
    const isXML = checkIsXml(contentType);

    if (!isXML) {
      logger.debug(`${link} is not a valid RSS feed`);

      return { isValid: false, reason: `${link} is not a valid RSS feed` };
    }

    const parsedXml = parser.parse(content);
    if (!parsedXml || !checkIsValidXml(parsedXml)) {
      logger.debug(`${link} is not a valid RSS feed`);
      return { isValid: false, reason: `${link} is not a valid RSS feed` };
    }

    const name =
      parsedXml.rss || parsedXml["rdf:RDF"]
        ? parsedXml.rss.channel.title || parsedXml["rdf:RDF"].channel.title
        : parsedXml.feed.title;

    return { isValid: true, name };
  } catch (error) {
    logger.error(`Unexpected Error when validating Feed`, error as Error);
    return { isValid: false, reason: "Unexpected Server error" };
  }
};

const addFeed = async (link: string, name: string): Promise<Feed> => {
  const query = `INSERT INTO feed (title, link) VALUES($1, $2) returning *`;
  const { rows } = (await sqlClient.then((it) =>
    it.query(query, [name, link]),
  )) as {
    rows: Feed[];
  };

  return rows[0];
};

const subscribeToFeed = async (
  feed: Feed,
  name: string,
  userId: string,
): Promise<Feed> => {
  const query = `INSERT INTO feed_user_subscription (feed_id, user_id, name) VALUES($1, $2, $3) RETURNING *`;
  await sqlClient.then((it) => it.query(query, [feed.id, userId, name]));

  return feed;
};

export const addFeedSubscription = async (
  link: string,
  name: string,
  userId: string,
): Promise<Feed & { existed: boolean }> => {
  try {
    let existingFeed: Partial<SubscribedFeed> | null = await getFeedFromLink(
      link,
      userId,
    );
    const feedExists = !!existingFeed;

    if (existingFeed?.subscribed) {
      throw new ConflictError(existingFeed);
    }

    const checkValidity = await getRssDetails(link, userId);
    if (!checkValidity.isValid) {
      throw new InvalidError(link, checkValidity.reason!);
    }

    if (!existingFeed) {
      existingFeed = await addFeed(link, checkValidity.name || name);
    }

    await subscribeToFeed(existingFeed as Feed, name, userId);

    const { subscribed, ...newFeed } = existingFeed;
    return { ...(newFeed as Feed), existed: feedExists };
  } catch (error) {
    logger.error(`Unable to add Feed due to error`, error as Error);
    throw error;
  }
};

export const getRssFeeds = async (userId: string): Promise<Feed[]> => {
  const query = `
    SELECT feed_id as id, name as title, link FROM feed
    INNER JOIN feed_user_subscription subs on subs.feed_id=feed.id
    WHERE subs.user_id=$1
    ORDER by subs.created_at DESC
    `;
  const { rows } = (await sqlClient.then((it) =>
    it.query(query, [userId]),
  )) as {
    rows: Feed[];
  };
  return rows;
};

export const getLastRefreshedTime = async (): Promise<Date> => {
  const query = `SELECT updated_time FROM last_updated_time;`;
  const { rows } = (await sqlClient.then((it) => it.query(query))) as {
    rows: { updated_time: string }[];
  };

  return new Date(rows[0]?.updated_time);
};

export const getFeed = async (id: string, userId: string) => {
  const query = `
  SELECT * FROM feed
  LEFT JOIN (SELECT name, user_id, feed_id FROM feed_user_subscription where user_id=$1) fus on fus.feed_id = feed.id
  WHERE feed.id = $2;
  `;
  const { rows } = (await sqlClient.then((it) =>
    it.query(query, [userId, id]),
  )) as { rows: (Feed & { user_id: string })[] };

  return rows[0];
};

export const deleteFeed = async ({ id }: Feed) => {
  await sqlClient.then((it) =>
    it.query(`DELETE from feed WHERE id = $1`, [id]),
  );
};

export const updateFeed = async (
  id: string,
  userId: string,
  update: Partial<Feed>,
): Promise<Feed> => {
  const query = `
  UPDATE feed_user_subscription
  SET name = $1
  WHERE feed_id = $2 AND user_id = $3
  `;

  await sqlClient.then((it) => it.query(query, [update.title, id, userId]));
  const updated = (await sqlClient.then((it) =>
    it.query(`SELECT * FROM feed WHERE id = $1`, [id]),
  )) as {
    rows: Feed[];
  };

  return { ...updated.rows[0], title: update.title! };
};
