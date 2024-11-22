import { mergeMap } from "rxjs";
import { sqlClient } from "./db";
import { Feed } from "../../types/Feeds";
import { fromPromise } from "rxjs/internal/observable/innerFrom";

export const getRssFeeds$ = fromPromise(
  (async (): Promise<Feed[]> => {
    const { rows } = (await sqlClient.then((it) =>
      it.query(`SELECT * FROM feed`),
    )) as { rows: Feed[] };

    return rows;
  })(),
).pipe(mergeMap((it) => it));
