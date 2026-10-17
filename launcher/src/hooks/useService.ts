import { useCallback, useEffect, useRef, useState } from 'react';
import { wsClient, type PushMessage } from '../ws/client';

export interface ServiceState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  /** Re-fire the underlying call. */
  reload: () => void;
}

/** Call a service on mount; keeps skeleton → data flow consistent. */
export function useService<T>(fn: () => Promise<T>, deps: readonly unknown[] = []): ServiceState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fnRef
      .current()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

/** Subscribe to a ws push while mounted; the handler gets the push payload. */
export function useWsPush(onMessage: (msg: PushMessage) => void, deps: readonly unknown[] = []): void {
  const ref = useRef(onMessage);
  ref.current = onMessage;
  useEffect(() => wsClient.onPush((m) => ref.current(m)), deps);
}
