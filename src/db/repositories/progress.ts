import type { SQLiteDatabase } from 'expo-sqlite';
import type { PageRequest } from '../records';

/**
 * What the Progress tab reads. Every query counts only finished attempts, and
 * shares are score / total points (an essay can be worth more than one point,
 * and counts once it is marked), so a percent is never a count of right answers.
 * The per-exam queries all start from `exam_attempts(exam_id, finished_at)`.
 * `finished_at IS NOT NULL` is the range that index serves, and `+status` keeps
 * SQLite from picking the `(status, finished_at)` index instead, which would
 * read every finished attempt of every exam to answer for one.
 */

export type ProgressExam = {
  examId: string;
  name: string;
  /** The topic's title. Null once the topic is deleted. */
  topicTitle: string | null;
  tries: number;
  /** Best share of points, 0 to 1. Null if no attempt had points. */
  bestFraction: number | null;
};

/** Exams with at least one finished attempt, most recently taken first. One query; the picker filters it. */
export async function listProgressExams(database: SQLiteDatabase): Promise<ProgressExam[]> {
  const rows = await database.getAllAsync<{ exam_id: string; name: string; topic_title: string | null; tries: number; best: number | null }>(
    `SELECT e.id AS exam_id, e.name, t.title AS topic_title, s.tries, s.best
       FROM (SELECT exam_id, COUNT(*) AS tries, MAX(finished_at) AS last_finished_at,
                    MAX(CASE WHEN total_points > 0 AND score IS NOT NULL THEN score * 1.0 / total_points END) AS best
               FROM exam_attempts WHERE status = 'finished' GROUP BY exam_id) s
       JOIN exams e ON e.id = s.exam_id
       LEFT JOIN topics t ON t.id = e.topic_id
      ORDER BY s.last_finished_at DESC, e.id`,
  );
  return rows.map((row) => ({ examId: row.exam_id, name: row.name, topicTitle: row.topic_title, tries: row.tries, bestFraction: row.best }));
}

export type ExamProgressStats = {
  tries: number;
  bestFraction: number | null;
  averageFraction: number | null;
};

/** Best, average and the number of tries for one exam: one pass over its finished attempts. */
export async function getExamProgressStats(database: SQLiteDatabase, examId: string): Promise<ExamProgressStats> {
  const row = await database.getFirstAsync<{ tries: number; best: number | null; average: number | null }>(
    `SELECT COUNT(*) AS tries,
            MAX(CASE WHEN total_points > 0 AND score IS NOT NULL THEN score * 1.0 / total_points END) AS best,
            AVG(CASE WHEN total_points > 0 AND score IS NOT NULL THEN score * 1.0 / total_points END) AS average
       FROM exam_attempts
      WHERE exam_id = ? AND finished_at IS NOT NULL AND +status = 'finished'`,
    examId,
  );
  return { tries: row?.tries ?? 0, bestFraction: row?.best ?? null, averageFraction: row?.average ?? null };
}

export type FinishedAttemptScore = {
  attemptNumber: number;
  finishedAt: number;
  score: number;
  totalPoints: number;
  elapsedSeconds: number;
};

type FinishedScoreRow = { attempt_number: number; finished_at: number; score: number | null; total_points: number | null; elapsed_seconds: number };

const toFinishedScore = (row: FinishedScoreRow): FinishedAttemptScore => ({
  attemptNumber: row.attempt_number,
  finishedAt: row.finished_at,
  score: row.score ?? 0,
  totalPoints: row.total_points ?? 0,
  elapsedSeconds: row.elapsed_seconds,
});

const FINISHED_NEWEST_FIRST = `SELECT attempt_number, finished_at, score, total_points, elapsed_seconds
       FROM exam_attempts
      WHERE exam_id = ? AND finished_at IS NOT NULL AND +status = 'finished'
      ORDER BY finished_at DESC, attempt_number DESC`;

/** The newest `limit` finished attempts, newest first: the chart's bars (the screen draws them oldest first). */
export async function listLatestFinishedScores(database: SQLiteDatabase, examId: string, limit: number): Promise<FinishedAttemptScore[]> {
  const rows = await database.getAllAsync<FinishedScoreRow>(`${FINISHED_NEWEST_FIRST} LIMIT ?`, examId, limit);
  return rows.map(toFinishedScore);
}

/** One page of the attempts table, newest first. */
export async function listFinishedAttemptScoresPage(database: SQLiteDatabase, examId: string, page: PageRequest): Promise<FinishedAttemptScore[]> {
  const rows = await database.getAllAsync<FinishedScoreRow>(`${FINISHED_NEWEST_FIRST} LIMIT ? OFFSET ?`, examId, page.limit, page.offset);
  return rows.map(toFinishedScore);
}
