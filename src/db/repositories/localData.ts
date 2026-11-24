import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * The phone's data as a whole: what the hand-over shows, backs up and erases.
 * One phone holds one person's topics and exams.
 */

export type LocalDataSummary = { topicCount: number; questionCount: number; examCount: number };

export async function summarizeLocalData(database: SQLiteDatabase): Promise<LocalDataSummary> {
  const row = await database.getFirstAsync<{ topic_count: number; question_count: number; exam_count: number }>(
    `SELECT (SELECT COUNT(*) FROM topics) AS topic_count,
            (SELECT COUNT(*) FROM topic_questions) AS question_count,
            (SELECT COUNT(*) FROM exams) AS exam_count`,
  );
  return { topicCount: row?.topic_count ?? 0, questionCount: row?.question_count ?? 0, examCount: row?.exam_count ?? 0 };
}

export const hasLocalData = (summary: LocalDataSummary): boolean => summary.topicCount > 0 || summary.examCount > 0;

/** Every table a backup carries, parents before children so a restore can insert in this order. */
export const BACKUP_TABLES = [
  'topics',
  'topic_section_directions',
  'topic_questions',
  'topic_question_answer_multiple',
  'topic_question_answer_true_false',
  'topic_question_answer_essay',
  'exams',
  'exam_attempts',
  'attempt_questions',
  'attempt_answers',
] as const;

export type LocalTables = Record<(typeof BACKUP_TABLES)[number], Array<Record<string, unknown>>>;

/** Reads every row of every backed-up table. Used once, for a backup; never for a screen. */
export async function readAllLocalTables(database: SQLiteDatabase): Promise<LocalTables> {
  const tables = {} as LocalTables;
  for (const table of BACKUP_TABLES) {
    tables[table] = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }
  return tables;
}

/**
 * Erases the person's data from this phone: topics, exams, attempts, the
 * profile, and the settings back to their defaults. All or nothing.
 */
export async function eraseAllLocalData(database: SQLiteDatabase): Promise<void> {
  await database.withTransactionAsync(async () => {
    // Children go with their parents through ON DELETE CASCADE.
    await database.runAsync('DELETE FROM exams');
    await database.runAsync('DELETE FROM topics');
    await database.runAsync('DELETE FROM profile');
    await database.runAsync(
      `UPDATE settings SET low_credit_alert_on = 1, low_credit_threshold_units = 80, low_credit_alerted = 0,
              balance_units_cache = NULL, balance_checked_at = NULL WHERE id = 1`,
    );
  });
}
