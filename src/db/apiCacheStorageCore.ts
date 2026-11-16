import { eq, lt } from 'drizzle-orm';

import { API_CACHE_MAX_AGE_MS } from '@/constants/db';

import type { db } from './connection';
import type { ApiCacheStorage } from './apiCache.types';
import { apiCache } from './schema';

type ApiCacheDatabase = typeof db;

export function createApiCacheStorage(database: ApiCacheDatabase): {
  storage: ApiCacheStorage;
  markCacheReady: () => void;
  pruneApiCache: () => Promise<void>;
} {
  let cacheReady = false;
  let prunePromise: Promise<void> | undefined;

  const storage: ApiCacheStorage = {
    async get(key) {
      if (!cacheReady) return undefined;
      return await database.select().from(apiCache).where(eq(apiCache.key, key)).get();
    },

    async set(record) {
      if (!cacheReady) return;
      await database
        .insert(apiCache)
        .values(record)
        .onConflictDoUpdate({
          target: apiCache.key,
          set: { data: record.data, cachedAt: record.cachedAt },
        });
    },
  };

  function markCacheReady(): void {
    cacheReady = true;
  }

  function pruneApiCache(): Promise<void> {
    if (!cacheReady) return Promise.resolve();
    if (!prunePromise) {
      const cutoff = new Date(Date.now() - API_CACHE_MAX_AGE_MS).toISOString();
      prunePromise = (async () => {
        await database.delete(apiCache).where(lt(apiCache.cachedAt, cutoff));
      })();
    }
    return prunePromise;
  }

  return { storage, markCacheReady, pruneApiCache };
}
