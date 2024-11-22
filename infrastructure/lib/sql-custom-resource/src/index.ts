import {
  CdkCustomResourceResponse,
  CloudFormationCustomResourceEvent,
  Context
} from 'aws-lambda'
import { Client, ClientBase } from 'pg'
import * as rds from '@aws-sdk/rds-signer'
import * as secret from '@aws-sdk/client-secrets-manager'
import * as fs from 'fs'

const SQL_QUERY = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
${process.env['USES_PROXY'] !== 'true' ? 'GRANT rds_iam TO "rssAggregator";' : ''};

CREATE TABLE IF NOT EXISTS users ( 
    id uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email text NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name text NOT NULL,
  deletable boolean DEFAULT true
);

INSERT INTO
  topics(id, name, deletable)
VALUES
  ('686ed645-728a-4c9e-aec5-240c31af9b0d', 'All', false);

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      'd34bc9d6-b52a-4ff4-93e4-2889fcce9a78',
      'Technology',
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      'e1f4104c-2b11-48c2-ba8c-d541af461334',
      'Politics', 
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      '79edc71b-1c5d-432b-ba9f-c059c74e53ab',
      'Health & Wellbeing',
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      'b327c31f-6c1b-4ff6-a2ac-538f050469c5',
      'Business & Finance', 
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      '763130a4-41f0-4a1c-ac45-841bc56e98a9',
      'Science & Education',
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      '1d2f51c9-c32e-44c3-9651-334ad7470238',
      'Culture', 
      false
  );

INSERT INTO
  topics (id, name, deletable)
VALUES
  (
      '77e3807b-6d94-43b9-8982-7adb009aacee',
      'Shopping',
      false
  );

CREATE TABLE IF NOT EXISTS user_topic_link (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    hidden boolean DEFAULT false,
    position  SERIAL,
    UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS topic_embedding_link (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    embedding_description text NOT NULL,
    embedding vector(1024)
);

CREATE TABLE IF NOT EXISTS feed(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title text NOT NULL,
    link text NOT NULL,
    UNIQUE (link),
    description text,
    image text
);

INSERT INTO feed (id, title, link) VALUES('dacd3088-aadb-11ee-bbfe-5f5fa18779ea', 'ArsTechnica - All', 'https://feeds.arstechnica.com/arstechnica/index');
INSERT INTO feed (id, title, link) VALUES('405eb048-aadc-11ee-bbfe-ff801479b901', 'Wired', 'https://www.wired.com/feed/rss');

CREATE TABLE IF NOT EXISTS feed_user_subscription(
    feed_id uuid NOT NULL REFERENCES feed(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name text NOT NULL,
    PRIMARY KEY (feed_id, user_id)
);

BEGIN;


CREATE OR REPLACE FUNCTION create_discover_feed_topic_subscription()
    RETURNS trigger AS $$
    BEGIN
        INSERT INTO feed_user_subscription(user_id, feed_id, name) VALUES(NEW.id, 'dacd3088-aadb-11ee-bbfe-5f5fa18779ea', 'ArsTechnica');
        INSERT INTO feed_user_subscription(user_id, feed_id, name) VALUES(NEW.id, '405eb048-aadc-11ee-bbfe-ff801479b901', 'Wired');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, '686ed645-728a-4c9e-aec5-240c31af9b0d');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, 'd34bc9d6-b52a-4ff4-93e4-2889fcce9a78');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, 'e1f4104c-2b11-48c2-ba8c-d541af461334');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, '79edc71b-1c5d-432b-ba9f-c059c74e53ab');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, 'b327c31f-6c1b-4ff6-a2ac-538f050469c5');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, '763130a4-41f0-4a1c-ac45-841bc56e98a9');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, '1d2f51c9-c32e-44c3-9651-334ad7470238');
        INSERT INTO user_topic_link(user_id, topic_id) VALUES(NEW.id, '77e3807b-6d94-43b9-8982-7adb009aacee');
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_feed_new_user
    AFTER INSERT ON "users"
    FOR EACH ROW EXECUTE PROCEDURE create_discover_feed_topic_subscription();

COMMIT;

CREATE TABLE IF NOT EXISTS feed_articles (
    id uuid PRIMARY KEY,
    feed_id uuid NOT NULL REFERENCES feed(id) ON DELETE CASCADE,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    url text NOT NULL,
    author text,
    image text,
    published_at timestamptz NOT NULL DEFAULT current_timestamp,
    embedding vector(1024),
    UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS feed_article_topic_link (
    feed_article_id uuid NOT NULL REFERENCES feed_articles(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE (feed_article_id,topic_id)
);

CREATE TABLE IF NOT EXISTS last_updated_time (
    id int PRIMARY KEY, 
    updated_time timestamptz NOT NULL DEFAULT current_timestamp
);`

const client = (async (): Promise<ClientBase> => {
  if (process.env['USES_PROXY'] === 'true') {
    const signer = new rds.Signer({
      port: 5432,
      username: process.env['DB_USERNAME']!,
      hostname: process.env['DB_HOST']!
    })

    const client = new Client({
      port: 5432,
      host: process.env['DB_HOST'],
      user: process.env['DB_USERNAME']!,
      password: await signer.getAuthToken(),
      database: process.env['DB_NAME']!,
      ssl: true
    })

    await client.connect()
    return client
  }

  const secretManager = new secret.SecretsManager()
  const command = new secret.GetSecretValueCommand({
    SecretId: process.env.SECRET_ID
  })
  const response = await secretManager.send(command)
  const secretMap = JSON.parse(response.SecretString!)

  const client = new Client({
    port: 5432,
    host: process.env['DB_HOST'],
    user: process.env['DB_USERNAME']!,
    password: secretMap['password'],
    database: process.env['DB_NAME']!,
    ssl: {
      requestCert: true, 
      ca: fs.readFileSync("global-bundle.pem")
    }
  })

  console.log("Connecting...")
  client.connect()
  console.log("Connected")
  return client
})()

const setupDatabase = () => client.then(it => it.query(SQL_QUERY))

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<CdkCustomResourceResponse> => {
  const resp: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName
  }

  switch (event.RequestType) {
    case 'Update':
    case 'Create':
      await setupDatabase()
      return {
        ...resp,
        Status: 'SUCCESS'
      }
    case 'Delete':
      return {
        ...resp,
        Status: 'SUCCESS',
        Data: { Result: {} }
      }
  }
}
