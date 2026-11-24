import type { SQLiteDatabase } from 'expo-sqlite';
import type { AttemptQuestion, AttemptStatus, Exam, ExamAttempt, PageRequest } from '../records';
import { getAttempt, insertAttemptRows } from './attempts';
import { toSqlBoolean } from './sqlPlaceholders';

type ExamRow = {
  id: string;
  topic_id: string | null;
  name: string;
  item_count: number;
  shuffle_questions: number;
  shuffle_choices: number;
  created_at: number;
};

const toExam = (row: ExamRow): Exam => ({
  id: row.id,
  topicId: row.topic_id,
  name: row.name,
  itemCount: row.item_count,
  shuffleQuestions: row.shuffle_questions === 1,
  shuffleChoices: row.shuffle_choices === 1,
  createdAt: row.created_at,
});

/**
 * Saves a new exam with its first paid attempt and the attempt's copied
 * questions, all or nothing. Called after the server has charged.
 */
export async function insertExamWithFirstAttempt(
  database: SQLiteDatabase,
  exam: Exam,
  attempt: ExamAttempt,
  questions: AttemptQuestion[],
): Promise<void> {
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT INTO exams (id, topic_id, name, item_count, shuffle_questions, shuffle_choices, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      exam.id,
      exam.topicId,
      exam.name,
      exam.itemCount,
      toSqlBoolean(exam.shuffleQuestions),
      toSqlBoolean(exam.shuffleChoices),
      exam.createdAt,
    );
    await insertAttemptRows(database, attempt, questions);
  });
}

/**
 * Saves a new exam and its first attempt as `charging`, with no questions yet,
 * all or nothing. The questions are copied in once the server has charged.
 */
export async function insertChargingExam(database: SQLiteDatabase, exam: Exam, attempt: ExamAttempt): Promise<void> {
  await insertExamWithFirstAttempt(database, exam, { ...attempt, attemptNumber: 1, status: 'charging' }, []);
}

export async function getExam(database: SQLiteDatabase, examId: string): Promise<Exam | null> {
  const row = await database.getFirstAsync<ExamRow>('SELECT * FROM exams WHERE id = ?', examId);
  return row ? toExam(row) : null;
}

export type ExamListItem = Exam & {
  attemptCount: number;
  latestStatus: AttemptStatus | null;
  latestScore: number | null;
  latestTotalPoints: number | null;
};

const LIST_SELECT = `SELECT e.*,
       (SELECT COUNT(*) FROM exam_attempts a WHERE a.exam_id = e.id) AS attempt_count,
       l.status AS latest_status, l.score AS latest_score, l.total_points AS latest_total_points
  FROM exams e
  LEFT JOIN exam_attempts l ON l.id = (
    SELECT a.id FROM exam_attempts a WHERE a.exam_id = e.id ORDER BY a.attempt_number DESC LIMIT 1)`;

type ExamListRow = ExamRow & {
  attempt_count: number;
  latest_status: AttemptStatus | null;
  latest_score: number | null;
  latest_total_points: number | null;
};

const toExamListItem = (row: ExamListRow): ExamListItem => ({
  ...toExam(row),
  attemptCount: row.attempt_count,
  latestStatus: row.latest_status,
  latestScore: row.latest_score,
  latestTotalPoints: row.latest_total_points,
});

/** Every exam, newest first, with its latest attempt. */
export async function listExamsPage(database: SQLiteDatabase, page: PageRequest): Promise<ExamListItem[]> {
  const rows = await database.getAllAsync<ExamListRow>(`${LIST_SELECT} ORDER BY e.created_at DESC, e.id LIMIT ? OFFSET ?`, page.limit, page.offset);
  return rows.map(toExamListItem);
}

/** A topic's exams, newest first, with each one's latest attempt. */
export async function listExamsByTopic(database: SQLiteDatabase, topicId: string, page: PageRequest): Promise<ExamListItem[]> {
  const rows = await database.getAllAsync<ExamListRow>(
    `${LIST_SELECT} WHERE e.topic_id = ? ORDER BY e.created_at DESC, e.id LIMIT ? OFFSET ?`,
    topicId,
    page.limit,
    page.offset,
  );
  return rows.map(toExamListItem);
}

/** Deletes the exam with all its attempts and answers. Its reminders must be cancelled first. */
export async function deleteExam(database: SQLiteDatabase, examId: string): Promise<boolean> {
  const result = await database.runAsync('DELETE FROM exams WHERE id = ?', examId);
  return result.changes > 0;
}

/** How many exams were made from this topic, for the topic screen's header. */
export async function countExamsByTopic(database: SQLiteDatabase, topicId: string): Promise<number> {
  const row = await database.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM exams WHERE topic_id = ?', topicId);
  return row?.total ?? 0;
}

/** An attempt with the exam it belongs to: what the take and results screens open with. */
export async function getAttemptWithExam(database: SQLiteDatabase, attemptId: string): Promise<{ attempt: ExamAttempt; exam: Exam } | null> {
  const attempt = await getAttempt(database, attemptId);
  if (!attempt) return null;
  const exam = await getExam(database, attempt.examId);
  return exam ? { attempt, exam } : null;
}

export type ReviewedExam = {
  examId: string;
  name: string;
  itemCount: number;
  finishedAttemptCount: number;
  /** The best share of points over its finished attempts, 0 to 1. Null if none had points. */
  bestFraction: number | null;
  lastAttemptId: string;
  lastScore: number;
  lastTotalPoints: number;
  lastFinishedAt: number;
};

/** Exams with at least one finished attempt, most recently taken first: "Continue reviewing". */
export async function listReviewedExamsPage(database: SQLiteDatabase, page: PageRequest): Promise<ReviewedExam[]> {
  const rows = await database.getAllAsync<{
    exam_id: string;
    name: string;
    item_count: number;
    attempt_count: number;
    best_fraction: number | null;
    last_attempt_id: string;
    last_score: number | null;
    last_total: number | null;
    last_finished_at: number;
  }>(
    `SELECT e.id AS exam_id, e.name, e.item_count,
            (SELECT COUNT(*) FROM exam_attempts a WHERE a.exam_id = e.id AND a.status = 'finished') AS attempt_count,
            (SELECT MAX(a.score * 1.0 / a.total_points) FROM exam_attempts a WHERE a.exam_id = e.id AND a.status = 'finished' AND a.total_points > 0) AS best_fraction,
            l.id AS last_attempt_id, l.score AS last_score, l.total_points AS last_total, l.finished_at AS last_finished_at
       FROM exams e
       JOIN exam_attempts l ON l.id = (
         SELECT a.id FROM exam_attempts a WHERE a.exam_id = e.id AND a.status = 'finished' ORDER BY a.finished_at DESC, a.attempt_number DESC LIMIT 1)
      ORDER BY l.finished_at DESC, e.id
      LIMIT ? OFFSET ?`,
    page.limit,
    page.offset,
  );
  return rows.map((row) => ({
    examId: row.exam_id,
    name: row.name,
    itemCount: row.item_count,
    finishedAttemptCount: row.attempt_count,
    bestFraction: row.best_fraction,
    lastAttemptId: row.last_attempt_id,
    lastScore: row.last_score ?? 0,
    lastTotalPoints: row.last_total ?? 0,
    lastFinishedAt: row.last_finished_at,
  }));
}

/** How many attempts an exam has (not counting one still being charged), for the delete warning. */
export async function countExamAttempts(database: SQLiteDatabase, examId: string): Promise<number> {
  const row = await database.getFirstAsync<{ total: number }>("SELECT COUNT(*) AS total FROM exam_attempts WHERE exam_id = ? AND status <> 'charging'", examId);
  return row?.total ?? 0;
}
