import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const apiCache = sqliteTable('apiCache', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
  cachedAt: text('cachedAt').notNull(),
});

export type ApiCacheRow = typeof apiCache.$inferSelect;
