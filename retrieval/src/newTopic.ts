import {
  of,
  scheduled,
  combineLatestAll,
  asyncScheduler,
  Observable,
  map,
  lastValueFrom,
} from "rxjs";
import { Topic } from "./types/Label";
import { fromArrayLike } from "rxjs/internal/observable/innerFrom";
import {
  addEmbeddingToLabel$ as addEmbeddingToTopic$,
  getArticlesFromTopic as getArticlesMatchingTopic,
} from "./lib/ai/embedding";
import { insertLabelToStore$ as insertTopicToStore$ } from "./lib/store/topics";
import { batchInsertTopicLink } from "./lib/store/articles";

const createCombinedTopicObserver = (
  topic: Partial<Topic>,
  related: string[],
) =>
  scheduled([of(topic), fromArrayLike(related)], asyncScheduler).pipe(
    combineLatestAll(),
    map(
      ([baseTopic, relatedSubject]) =>
        ({
          ...(baseTopic as Partial<Topic>),
          description: relatedSubject,
        }) as Topic,
    ),
  );

export const populateNewTopic = async (topic: Topic, related: string[]) => {
  // First we want to zip the topics together, to create something that can be embedded.
  const topic$: Observable<Topic> = createCombinedTopicObserver(topic, related);

  // Insert the topics and their associated embeddings
  const embedAndInsertTopics$ = topic$.pipe(
    addEmbeddingToTopic$,
    insertTopicToStore$,
  );

  // Wait until all the embeddings are complete.
  await lastValueFrom(embedAndInsertTopics$);

  const articlesMatched = await getArticlesMatchingTopic(topic);
  const batchArticleToTag = articlesMatched.map((articleId) => [
    topic.id,
    articleId,
  ]);
  console.log(batchArticleToTag);
  await batchInsertTopicLink(batchArticleToTag);
};
