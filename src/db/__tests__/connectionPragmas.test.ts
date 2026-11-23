import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONNECTION_PRAGMAS } from '../connectionPragmas';

describe('CONNECTION_PRAGMAS', () => {
  let directory: string;
  let database: Database.Database;

  beforeEach(() => {
    // WAL needs a file; an in-memory database always reports "memory".
    directory = mkdtempSync(path.join(tmpdir(), 'reviewer-db-'));
    database = new Database(path.join(directory, 'reviewer.db'));
    database.exec(CONNECTION_PRAGMAS);
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('puts the file in WAL mode', () => {
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
  });

  it('turns foreign keys on, so cascades run', () => {
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);

    database.exec(`
      CREATE TABLE topics (id TEXT PRIMARY KEY);
      CREATE TABLE topic_questions (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE);
      INSERT INTO topics VALUES ('t1');
      INSERT INTO topic_questions VALUES ('q1', 't1');
      DELETE FROM topics WHERE id = 't1';
    `);
    expect(database.prepare('SELECT COUNT(*) AS remaining FROM topic_questions').get()).toEqual({ remaining: 0 });
  });

  it('sets synchronous to NORMAL', () => {
    expect(database.pragma('synchronous', { simple: true })).toBe(1);
  });
});
