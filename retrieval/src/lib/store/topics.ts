import { filter, map, mergeMap } from "rxjs/operators";
import { toSql } from "pgvector/pg";
import { OperatorFunction } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { sqlClient } from "./db";
import { Topic, EmbeddedTopic } from "../../types/Label";

const hasLabelsStoredInDatabase = async (label: string) => {
  const { rows } = await sqlClient.then((it) =>
    it.query(`SELECT label FROM label_embeddings where label = $1`, [label]),
  );
  return rows && rows.length === 0;
};

export const removeDuplicateTopics = mergeMap((x: Topic) =>
  fromPromise(hasLabelsStoredInDatabase(x.name)).pipe(
    filter(Boolean),
    map(() => x),
  ),
);

export const insertTopics = async (
  embeddedTopic: EmbeddedTopic,
): Promise<EmbeddedTopic> => {
  if (embeddedTopic.topic.name && embeddedTopic.topic.description) {
    await sqlClient.then((it) =>
      it.query(
        "INSERT INTO topic_embedding_link(topic_id, embedding_description, embedding) VALUES($1, $2, $3)",
        [
          embeddedTopic.topic.id,
          embeddedTopic.topic.description,
          toSql(embeddedTopic.embedding),
        ],
      ),
    );
  }
  return embeddedTopic;
};

export const insertLabelToStore$: OperatorFunction<
  EmbeddedTopic,
  EmbeddedTopic
> = mergeMap((x) => fromPromise(insertTopics(x)));
