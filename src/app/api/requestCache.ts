const TTL_MS = 3_000;

type CacheEntry<T> = {
  at: number;
  promise: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

/** Coalesce identical API reads during the same page load (e.g. Sidebar + Dashboard). */
export function cachedRequest<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) {
    return hit.promise as Promise<T>;
  }

  const promise = loader();
  cache.set(key, { at: now, promise });
  return promise;
}

export function invalidateCachedRequest(key: string) {
  cache.delete(key);
}

export function invalidateCachedRequestPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
