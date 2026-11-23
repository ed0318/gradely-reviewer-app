import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { CONNECTION_PRAGMAS } from './connectionPragmas';
import { runMigrations } from './runMigrations';

export const DATABASE_NAME = 'reviewer.db';

/**
 * The open promise, not the database, so two callers arriving together share
 * one open instead of opening the file twice.
 */
let opening: Promise<SQLiteDatabase> | null = null;

/**
 * The one shared connection, opened with WAL and foreign keys on and migrated
 * to the newest schema. Reads call this and pass it to a repository.
 */
export function openDatabase(): Promise<SQLiteDatabase> {
  if (!opening) {
    opening = (async () => {
      const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      // Pragmas first: WAL cannot be switched on inside a migration's transaction.
      await database.execAsync(CONNECTION_PRAGMAS);
      await runMigrations(database);
      return database;
    })().catch((error: unknown) => {
      // A failed open is not cached, or every later call would re-throw it.
      opening = null;
      throw error;
    });
  }
  return opening;
}

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * Runs a write after every write before it has finished. expo-sqlite does not
 * order a transaction against other queries on the same connection, so every
 * write goes through here; a repository that writes several rows opens its own
 * transaction inside.
 */
export function queueWrite<T>(work: (database: SQLiteDatabase) => Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => work(await openDatabase()));
  // The queue survives a failed write; the caller still sees its own rejection.
  writeQueue = run.catch(() => undefined);
  return run;
}
