import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { db } from './connection';

export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}
