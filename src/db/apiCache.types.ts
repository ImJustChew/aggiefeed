export interface ApiCacheRecord {
  key: string;
  data: string;
  cachedAt: string;
}

export interface ApiCacheStorage {
  get(key: string): Promise<ApiCacheRecord | undefined>;
  set(record: ApiCacheRecord): Promise<void>;
}

export type ApiCachePolicy = 'cache-first' | 'network-first';
