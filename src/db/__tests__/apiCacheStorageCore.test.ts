import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import type { SQL } from 'drizzle-orm';

import { API_CACHE_MAX_AGE_MS } from '@/constants/db';

import type { db } from '../connection';
import { createApiCacheStorage } from '../apiCacheStorageCore';
import { apiCache } from '../schema';

function createFakeDatabase() {
  const cachedRow = {
    key: 'test',
    data: '{"value":"cached"}',
    cachedAt: '2026-11-11T12:00:00.000Z',
  };
  const get = jest.fn().mockResolvedValue(cachedRow);
  const select = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ get }),
    }),
  });
  const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
  const insert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({ onConflictDoUpdate }),
  });
  const deleteWhere = jest.fn((_condition: unknown) => Promise.resolve());
  const deleteTable = jest.fn().mockReturnValue({ where: deleteWhere });
  const database = { select, insert, delete: deleteTable } as unknown as typeof db;

  return { database, deleteTable, deleteWhere, get, insert, onConflictDoUpdate, select };
}

describe('api cache storage readiness and pruning', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('skips cache reads and writes until migrations mark storage ready', async () => {
    const fake = createFakeDatabase();
    const cache = createApiCacheStorage(fake.database);

    await expect(cache.storage.get('test')).resolves.toBeUndefined();
    await cache.storage.set({ key: 'test', data: '{"value":"fresh"}', cachedAt: 'now' });

    expect(fake.select).not.toHaveBeenCalled();
    expect(fake.insert).not.toHaveBeenCalled();

    cache.markCacheReady();
    await expect(cache.storage.get('test')).resolves.toEqual({
      key: 'test',
      data: '{"value":"cached"}',
      cachedAt: '2026-11-11T12:00:00.000Z',
    });
    await cache.storage.set({ key: 'test', data: '{"value":"fresh"}', cachedAt: 'now' });

    expect(fake.select).toHaveBeenCalledTimes(1);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it('deletes cache rows older than seven days once, after readiness', async () => {
    const fake = createFakeDatabase();
    const cache = createApiCacheStorage(fake.database);
    const now = new Date('2026-11-11T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    await cache.pruneApiCache();
    expect(fake.deleteTable).not.toHaveBeenCalled();

    cache.markCacheReady();
    await Promise.all([cache.pruneApiCache(), cache.pruneApiCache()]);

    expect(fake.deleteTable).toHaveBeenCalledTimes(1);
    expect(fake.deleteTable).toHaveBeenCalledWith(apiCache);
    expect(fake.deleteWhere).toHaveBeenCalledTimes(1);

    const condition = fake.deleteWhere.mock.calls[0]?.[0] as SQL;
    const query = new SQLiteSyncDialect().sqlToQuery(condition);
    expect(query.params).toEqual([new Date(now.getTime() - API_CACHE_MAX_AGE_MS).toISOString()]);
  });
});
