import { useEffect, useState } from 'react';

type Subscribe = (listener: () => void) => () => void;

interface QueryState<T> {
  value?: T;
  error?: unknown;
}

/**
 * Run an async read and keep its result fresh: it is re-run whenever `subscribe` reports a change.
 * Returns undefined until the first result arrives. A failed read is thrown during render so the nearest
 * error boundary shows it.
 *
 * `read` must be a stable function (module-level, or wrapped in useCallback): a new function identity
 * means "this is a different query" and starts again from undefined.
 */
export function useQuery<T>(subscribe: Subscribe, read: () => Promise<T>): T | undefined {
  const [state, setState] = useState<QueryState<T>>({});

  useEffect(() => {
    let active = true;
    let latestRun = 0;
    setState({});

    function load() {
      latestRun += 1;
      const run = latestRun;
      // A slow earlier read must not overwrite the result of a later one.
      const isCurrent = () => active && run === latestRun;
      read().then(
        (value) => {
          if (isCurrent()) setState({ value });
        },
        (error: unknown) => {
          if (isCurrent()) setState({ error });
        },
      );
    }

    load();
    const unsubscribe = subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [subscribe, read]);

  if (state.error !== undefined) throw state.error;
  return state.value;
}
