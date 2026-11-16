import { apiCacheStorage } from './apiCacheStorage';
import type { ApiCachePolicy, ApiCacheStorage } from './apiCache.types';

export interface GetCachedOrFetchOptions<T> {
  key: string;
  policy: ApiCachePolicy;
  fetcher: () => Promise<unknown>;
  parse: (payload: unknown) => T;
  ttlMs?: number;
  signal?: AbortSignal;
  storage?: ApiCacheStorage;
  now?: () => number;
}

interface ParsedCacheRecord<T> {
  value: T;
  cachedAt: number;
}

function logCacheError(operation: string, key: string, error: unknown): void {
  // eslint-disable-next-line no-console -- cache failures are diagnostic-only in development.
  if (__DEV__) console.warn(`API cache ${operation} failed for "${key}".`, error);
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

/**
 * Fetches raw JSON data, reparses both network and cached payloads, and treats persistence as
 * best-effort so a cache problem never takes down the network path.
 */
export async function getCachedOrFetch<T>({
  key,
  policy,
  fetcher,
  parse,
  ttlMs = 0,
  signal,
  storage = apiCacheStorage,
  now = Date.now,
}: GetCachedOrFetchOptions<T>): Promise<T> {
  const readCache = async (): Promise<ParsedCacheRecord<T> | undefined> => {
    let row;
    try {
      row = await storage.get(key);
    } catch (error) {
      logCacheError('read', key, error);
      return undefined;
    }

    if (!row) return undefined;

    try {
      const value = parse(JSON.parse(row.data) as unknown);
      return { value, cachedAt: Date.parse(row.cachedAt) };
    } catch (error) {
      logCacheError('deserialize', key, error);
      return undefined;
    }
  };

  const cached = policy === 'cache-first' ? await readCache() : undefined;
  if (cached && Number.isFinite(cached.cachedAt) && now() - cached.cachedAt < ttlMs) {
    return cached.value;
  }

  let payload: unknown;
  let value: T;
  try {
    payload = await fetcher();
    value = parse(payload);
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) throw error;

    const fallback = cached ?? (await readCache());
    if (signal?.aborted) throw error;
    if (fallback) return fallback.value;
    throw error;
  }

  try {
    const data = JSON.stringify(payload);
    if (data !== undefined) {
      await storage.set({ key, data, cachedAt: new Date(now()).toISOString() });
    }
  } catch (error) {
    logCacheError('write', key, error);
  }

  return value;
}
