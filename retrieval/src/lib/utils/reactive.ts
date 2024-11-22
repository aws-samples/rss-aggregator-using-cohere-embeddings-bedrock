import {
  catchError,
  concatMap,
  delay,
  EMPTY,
  mergeMap,
  MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  pipe,
  timer,
} from "rxjs";
import { filter, retry } from "rxjs/operators";
import { Article } from "../../types/Article";
import { fromPromise } from "rxjs/internal/observable/innerFrom";

export const exponentialBackOff = <T>(
  count: number,
): MonoTypeOperatorFunction<T> =>
  retry({
    count,
    delay: (error, retryIndex, interval = 200) => {
      console.error(`Error: ${error}. Retrying...`, error);
      const delay = Math.pow(2, retryIndex - 1) * interval;
      console.log(
        `Backing off: attempt ${retryIndex}, Trying again in: ${delay}ms`,
      );

      return timer(delay);
    },
  });

export const onErrorContinue = (...pipes: OperatorFunction<any, any>[]) =>
  mergeMap((it: any) => {
    let observer: Observable<any> = of(it);
    pipes.forEach((pipe) => {
      observer = observer.pipe(pipe);
    });

    return observer.pipe(
      catchError((e) => {
        console.error("Error caught in pipe, skipping", e);
        return EMPTY;
      }),
    );
  });

export const rateLimiter = <T>(params: {
  resetLimit: number;
  timeMs: number;
}) => {
  return concatMap((it: T) => {
    return of(it).pipe(delay(params.timeMs / params.resetLimit));
  });
};

export function mapOrNull(project: (article: never) => Promise<Article>) {
  return pipe(
    concatMap((item: never) => {
      try {
        return fromPromise(project(item).catch(() => null)).pipe(
          filter((it) => !!it),
        ) as Observable<Article>;
      } catch (e) {
        console.error(e);
        return EMPTY;
      }
    }),
  );
}
