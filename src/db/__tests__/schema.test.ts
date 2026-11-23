import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SCHEMA_VERSION } from '../migrations';
import { NewerDatabaseError, readSchemaVersion, runMigrations } from '../runMigrations';
import { openMemoryDatabase, openMigratedMemoryDatabase } from '../testing/memoryDatabase';

const EXPECTED_TABLES = [
  'attempt_answers',
  'attempt_questions',
  'exam_attempts',
  'exams',
  'profile',
  'settings',
  'topic_question_answer_essay',
  'topic_question_answer_multiple',
  'topic_question_answer_true_false',
  'topic_questions',
  'topic_section_directions',
  'topics',
];

describe('the schema', () => {
  it('creates every table and records the version', async () => {
    const database = await openMigratedMemoryDatabase();
    const tables = await database.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(tables.map((table) => table.name)).toEqual(EXPECTED_TABLES);
    expect(await readSchemaVersion(database)).toBe(SCHEMA_VERSION);
  });

  it('copies the Gradely exam tables column for column', async () => {
    const database = await openMigratedMemoryDatabase();
    const columnsOf = async (table: string) =>
      (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((column) => column.name);

    expect(await columnsOf('topic_questions')).toEqual(['id', 'topic_id', 'question', 'answer', 'type', 'point', 'sorting_order']);
    expect(await columnsOf('topic_question_answer_multiple')).toEqual(['id', 'topic_question_id', 'choice_text', 'is_correct', 'sort_order']);
    expect(await columnsOf('topic_question_answer_true_false')).toEqual(['id', 'topic_question_id', 'answer_is_true']);
    expect(await columnsOf('topic_question_answer_essay')).toEqual(['id', 'topic_question_id', 'answer_guide', 'no_lines']);
    expect(await columnsOf('topic_section_directions')).toEqual(['id', 'topic_id', 'question_type', 'mode', 'text']);
  });

  it('indexes every foreign key', async () => {
    const database = await openMigratedMemoryDatabase();
    for (const table of EXPECTED_TABLES) {
      const foreignKeys = await database.getAllAsync<{ from: string }>(`PRAGMA foreign_key_list(${table})`);
      const indexes = await database.getAllAsync<{ name: string }>(`PRAGMA index_list(${table})`);
      const leadingColumns = new Set<string>();
      for (const index of indexes) {
        const columns = await database.getAllAsync<{ name: string; seqno: number }>(`PRAGMA index_info(${index.name})`);
        const leading = columns.find((column) => column.seqno === 0);
        if (leading) leadingColumns.add(leading.name);
      }
      for (const foreignKey of foreignKeys) {
        expect(leadingColumns.has(foreignKey.from), `${table}.${foreignKey.from}`).toBe(true);
      }
    }
  });

  it('has the Progress index on exam_attempts(exam_id, finished_at)', async () => {
    const database = await openMigratedMemoryDatabase();
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA index_info(exam_attempts__exam_finished)');
    expect(columns.map((column) => column.name)).toEqual(['exam_id', 'finished_at']);
  });

  it('seeds the one settings row', async () => {
    const database = await openMigratedMemoryDatabase();
    expect(await database.getAllAsync('SELECT id, low_credit_threshold_units FROM settings')).toEqual([{ id: 1, low_credit_threshold_units: 40 }]);
  });

  it('runs again without changing anything', async () => {
    const database = await openMigratedMemoryDatabase();
    expect(await runMigrations(database)).toBe(SCHEMA_VERSION);
    expect(await database.getAllAsync('SELECT id FROM settings')).toHaveLength(1);
  });

  it('runs only the migrations after the file version, each with its version bump', async () => {
    const database = openMemoryDatabase();
    const migrations = [...MIGRATIONS, { version: SCHEMA_VERSION + 1, sql: 'CREATE TABLE later_table (id TEXT PRIMARY KEY);' }];
    await runMigrations(database, MIGRATIONS);
    expect(await runMigrations(database, migrations)).toBe(SCHEMA_VERSION + 1);
    expect(await readSchemaVersion(database)).toBe(SCHEMA_VERSION + 1);
  });

  it('rolls a failed migration back and keeps the version before it', async () => {
    const database = openMemoryDatabase();
    await runMigrations(database, MIGRATIONS);
    const broken = [...MIGRATIONS, { version: SCHEMA_VERSION + 1, sql: 'CREATE TABLE half_done (id TEXT); NOT VALID SQL;' }];
    await expect(runMigrations(database, broken)).rejects.toThrow();
    expect(await readSchemaVersion(database)).toBe(SCHEMA_VERSION);
    expect(await database.getAllAsync("SELECT name FROM sqlite_master WHERE name = 'half_done'")).toEqual([]);
  });

  it('refuses a file from a newer app', async () => {
    const database = await openMigratedMemoryDatabase();
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 5}`);
    await expect(runMigrations(database)).rejects.toBeInstanceOf(NewerDatabaseError);
  });
});
