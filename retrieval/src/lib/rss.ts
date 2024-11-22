import { pipe } from "rxjs";
import { addEmbeddingToArticle$, addTopicsToArticle$ } from "./ai/embedding";
import {
  removeDuplicateArticles$,
  insertArticleToStore$,
} from "./store/articles";

export const rssActions = pipe(
  removeDuplicateArticles$,
  addEmbeddingToArticle$,
  addTopicsToArticle$,
  insertArticleToStore$,
);
