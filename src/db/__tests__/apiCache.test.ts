import { getCachedOrFetch } from '@/db/apiCache';
import type { ApiCacheRecord, ApiCacheStorage } from '@/db/apiCache.types';

function createStorage(seed?: ApiCacheRecord): ApiCacheStorage {
  const rows = new Map<string, ApiCacheRecord>();
  if (seed) rows.set(seed.key, seed);

  return {
    async get(key) {
      return rows.get(key);
    },
    async set(record) {
      rows.set(record.key, record);
    },
  };
}

function row(data: string, cachedAt = '2026-11-11T12:00:00.000Z'): ApiCacheRecord {
  return { key: 'test', data, cachedAt };
}

describe('getCachedOrFetch', () => {
  const now = Date.parse('2026-11-11T12:30:00.000Z');
  const parse = (payload: unknown) => payload as { value: string };

  it('returns a fresh cache-first hit without requesting the network', async () => {
    const fetcher = jest.fn().mockResolvedValue({ value: 'network' });

    await expect(
      getCachedOrFetch({
        key: 'test',
        policy: 'cache-first',
        ttlMs: 60 * 60 * 1000,
        fetcher,
        parse,
        storage: createStorage(row('{"value":"cached"}')),
        now: () => now,
      }),
    ).resolves.toEqual({ value: 'cached' });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns a valid stale cache-first row when fetching fails', async () => {
    const networkError = new TypeError('offline');

    await expect(
      getCachedOrFetch({
        key: 'test',
        policy: 'cache-first',
        ttlMs: 1000,
        fetcher: jest.fn().mockRejectedValue(networkError),
        parse,
        storage: createStorage(row('{"value":"stale"}', '2026-11-11T11:00:00.000Z')),
        now: () => now,
      }),
    ).resolves.toEqual({ value: 'stale' });
  });

  it('falls back to any cached row after a network-first request fails', async () => {
    await expect(
      getCachedOrFetch({
        key: 'test',
        policy: 'network-first',
        fetcher: jest.fn().mockRejectedValue(new TypeError('offline')),
        parse,
        storage: createStorage(row('{"value":"old feed"}', '2026-10-01T00:00:00.000Z')),
        now: () => now,
      }),
    ).resolves.toEqual({ value: 'old feed' });
  });

  it('rethrows cancelled requests instead of returning cached data', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });

    await expect(
      getCachedOrFetch({
        key: 'test',
        policy: 'cache-first',
        ttlMs: 0,
        signal: controller.signal,
        fetcher: jest.fn().mockRejectedValue(abortError),
        parse,
        storage: createStorage(row('{"value":"stale"}', '2026-11-11T11:00:00.000Z')),
        now: () => now,
      }),
    ).rejects.toBe(abortError);
  });

  it('ignores a corrupt row and returns a successful network response', async () => {
    const fetcher = jest.fn().mockResolvedValue({ value: 'fresh' });

    await expect(
      getCachedOrFetch({
        key: 'test',
        policy: 'cache-first',
        ttlMs: 60 * 60 * 1000,
        fetcher,
        parse,
        storage: createStorage(row('{not-json')),
        now: () => now,
      }),
    ).resolves.toEqual({ value: 'fresh' });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
