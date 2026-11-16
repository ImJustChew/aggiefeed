import { db } from './connection';
import { createApiCacheStorage } from './apiCacheStorageCore';

const cache = createApiCacheStorage(db);

export const apiCacheStorage = cache.storage;
export const markCacheReady = cache.markCacheReady;
export const pruneApiCache = cache.pruneApiCache;
