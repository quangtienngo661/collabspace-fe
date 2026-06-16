import { useCallback, useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from "react";
import { formatApiError } from "../api/adminErrors";

export interface AsyncDataState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
}

export interface UseAsyncDataOptions {
  /** When false, skip the request until enabled becomes true. */
  enabled?: boolean;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  options: UseAsyncDataOptions = {},
): AsyncDataState<T> {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(formatApiError(err, "Unable to load data"));
    } finally {
      setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void reload();
  }, [reload, enabled]);

  return { data, error, loading, reload, setData };
}
