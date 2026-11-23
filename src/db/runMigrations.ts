import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './migrations';
import type { Migration } from './migrations/migration';

/** The database file was written by a newer app than this one. */
export class NewerDatabaseError extends Error {
  constructor(readonly fileVersion: number, readonly appVersion: number) {
    super(`The reviewer data is from a newer version of the app (schema ${fileVersion}, this app knows ${appVersion}).`);
    this.name = 'NewerDatabaseError';
  }
}

/**
 * Brings the file up to the newest schema. Each pending migration runs in its
 * own transaction together with the `user_version` bump, so a failure leaves
 * the file at the last version that finished.
 */
export async function runMigrations(database: SQLiteDatabase, migrations: readonly Migration[] = MIGRATIONS): Promise<number> {
  const latestVersion = migrations.length > 0 ? migrations[migrations.length - 1].version : 0;
  let currentVersion = await readSchemaVersion(database);
  if (currentVersion > latestVersion) throw new NewerDatabaseError(currentVersion, latestVersion);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
    });
    currentVersion = migration.version;
  }
  return currentVersion;
}

export async function readSchemaVersion(database: SQLiteDatabase): Promise<number> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}
