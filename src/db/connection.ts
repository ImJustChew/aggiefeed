import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { DATABASE_NAME } from '@/constants/db';

import * as schema from './schema';

export const expoDb = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });
