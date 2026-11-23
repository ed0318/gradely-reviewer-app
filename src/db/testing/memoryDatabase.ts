import Database from 'better-sqlite3';
import type { SQLiteDatabase } from 'expo-sqlite';
import { CONNECTION_PRAGMAS } from '../connectionPragmas';
import { runMigrations } from '../runMigrations';

/**
 * An in-memory database for tests that answers the parts of expo-sqlite's
 * `SQLiteDatabase` the repositories use. better-sqlite3 runs the same SQLite,
 * with the same foreign keys and CHECKs as the phone. Tests only: never import
 * this from app code.
 */
type BindParams = unknown[] | Record<string, unknown>;

/** expo-sqlite takes bind values as one array, one object, or spread arguments. */
function normalizeBindParams(params: unknown[]): BindParams {
  if (params.length === 1 && params[0] !== null && typeof params[0] === 'object') return params[0] as BindParams;
  return params;
}

export type TestDatabase = SQLiteDatabase & { raw: Database.Database };

export function openMemoryDatabase(): TestDatabase {
  const raw = new Database(':memory:');
  raw.exec(CONNECTION_PRAGMAS);

  const runStatement = (source: string, params: unknown[]) => {
    const statement = raw.prepare(source);
    const bound = normalizeBindParams(params);
    return Array.isArray(bound) ? statement.run(...bound) : statement.run(bound);
  };
  const readRows = (source: string, params: unknown[]) => {
    const statement = raw.prepare(source);
    const bound = normalizeBindParams(params);
    return Array.isArray(bound) ? statement.all(...bound) : statement.all(bound);
  };

  const database = {
    raw,
    async execAsync(source: string) {
      raw.exec(source);
    },
    async runAsync(source: string, ...params: unknown[]) {
      const result = runStatement(source, params);
      return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getAllAsync<T>(source: string, ...params: unknown[]) {
      return readRows(source, params) as T[];
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]) {
      return ((readRows(source, params) as T[])[0] ?? null) as T | null;
    },
    async withTransactionAsync(work: () => Promise<void>) {
      raw.exec('BEGIN');
      try {
        await work();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return database as unknown as TestDatabase;
}

/** A fresh database at the newest schema. */
export async function openMigratedMemoryDatabase(): Promise<TestDatabase> {
  const database = openMemoryDatabase();
  await runMigrations(database);
  return database;
}
