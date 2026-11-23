import type { SQLiteDatabase } from 'expo-sqlite';
import type { AttemptAnswer, AttemptChoice, AttemptQuestion, AttemptStatus, ExamAttempt, PageRequest, QuestionType } from '../records';
import { toSqlBoolean } from './sqlPlaceholders';

/**
 * Attempts: one paid sitting of an exam, with its questions copied in at
 * creation so a later edit or delete of the topic never changes a past exam,
 * its score or a retake.
 */

type AttemptRow = {
  id: string;
  exam_id: string;
  attempt_number: number;
  charge_id: string;
  units_charged: number;
  scheduled_at: number | null;
  remind_minutes_before: number | null;
  notification_id: string | null;
  started_at: number | null;
  finished_at: number | null;
  score: number | null;
  total_points: number | null;
  status: AttemptStatus;
};

type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
  position: number;
  type: QuestionType;
  question: string;
  point: number;
  answer: string | null;
  choices: string | null;
};

type AttemptAnswerRow = { id: string; attempt_question_id: string; given_answer: string | null; is_correct: number | null };

const toAttempt = (row: AttemptRow): ExamAttempt => ({
  id: row.id,
  examId: row.exam_id,
  attemptNumber: row.attempt_number,
  chargeId: row.charge_id,
  unitsCharged: row.units_charged,
  scheduledAt: row.scheduled_at,
  remindMinutesBefore: row.remind_minutes_before,
  notificationId: row.notification_id,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  score: row.score,
  totalPoints: row.total_points,
  status: row.status,
});

const toAttemptQuestion = (row: AttemptQuestionRow): AttemptQuestion => ({
  id: row.id,
  attemptId: row.attempt_id,
  position: row.position,
  type: row.type,
  question: row.question,
  point: row.point,
  answer: row.answer,
  choices: row.choices === null ? null : (JSON.parse(row.choices) as AttemptChoice[]),
});

/**
 * Writes an attempt and its copied questions without opening a transaction.
 * Only for callers that already hold one (`insertAttemptWithQuestions`,
 * `insertExamWithFirstAttempt`).
 */
export async function insertAttemptRows(database: SQLiteDatabase, attempt: ExamAttempt, questions: AttemptQuestion[]): Promise<void> {
  await database.runAsync(
    `INSERT INTO exam_attempts (id, exam_id, attempt_number, charge_id, units_charged, scheduled_at, remind_minutes_before,
                                notification_id, started_at, finished_at, score, total_points, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    attempt.id,
    attempt.examId,
    attempt.attemptNumber,
    attempt.chargeId,
    attempt.unitsCharged,
    attempt.scheduledAt,
    attempt.remindMinutesBefore,
    attempt.notificationId,
    attempt.startedAt,
    attempt.finishedAt,
    attempt.score,
    attempt.totalPoints,
    attempt.status,
  );
  for (const question of questions) {
    await database.runAsync(
      'INSERT INTO attempt_questions (id, attempt_id, position, type, question, point, answer, choices) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      question.id,
      attempt.id,
      question.position,
      question.type,
      question.question,
      question.point,
      question.answer,
      question.choices === null ? null : JSON.stringify(question.choices),
    );
  }
}

/** Saves a paid attempt (a retake, or the first one) with its questions, all or nothing. */
export async function insertAttemptWithQuestions(database: SQLiteDatabase, attempt: ExamAttempt, questions: AttemptQuestion[]): Promise<void> {
  await database.withTransactionAsync(() => insertAttemptRows(database, attempt, questions));
}

export async function findNextAttemptNumber(database: SQLiteDatabase, examId: string): Promise<number> {
  const row = await database.getFirstAsync<{ next_number: number }>(
    'SELECT IFNULL(MAX(attempt_number) + 1, 1) AS next_number FROM exam_attempts WHERE exam_id = ?',
    examId,
  );
  return row?.next_number ?? 1;
}

export async function getAttempt(database: SQLiteDatabase, attemptId: string): Promise<ExamAttempt | null> {
  const row = await database.getFirstAsync<AttemptRow>('SELECT * FROM exam_attempts WHERE id = ?', attemptId);
  return row ? toAttempt(row) : null;
}

export async function listAttemptsByExam(database: SQLiteDatabase, examId: string): Promise<ExamAttempt[]> {
  const rows = await database.getAllAsync<AttemptRow>('SELECT * FROM exam_attempts WHERE exam_id = ? ORDER BY attempt_number', examId);
  return rows.map(toAttempt);
}

/** An attempt's questions in the order they are asked. At most 100, so read whole. */
export async function listAttemptQuestions(database: SQLiteDatabase, attemptId: string): Promise<AttemptQuestion[]> {
  const rows = await database.getAllAsync<AttemptQuestionRow>('SELECT * FROM attempt_questions WHERE attempt_id = ? ORDER BY position', attemptId);
  return rows.map(toAttemptQuestion);
}

export async function listAttemptAnswers(database: SQLiteDatabase, attemptId: string): Promise<AttemptAnswer[]> {
  const rows = await database.getAllAsync<AttemptAnswerRow>(
    `SELECT a.id, a.attempt_question_id, a.given_answer, a.is_correct
       FROM attempt_answers a JOIN attempt_questions q ON q.id = a.attempt_question_id
      WHERE q.attempt_id = ? ORDER BY q.position`,
    attemptId,
  );
  return rows.map((row) => ({
    id: row.id,
    attemptQuestionId: row.attempt_question_id,
    givenAnswer: row.given_answer,
    isCorrect: row.is_correct === null ? null : row.is_correct === 1,
  }));
}

/** Saves the answer to one question, replacing an earlier one. */
export async function saveAttemptAnswer(database: SQLiteDatabase, answer: AttemptAnswer): Promise<void> {
  await database.runAsync(
    `INSERT INTO attempt_answers (id, attempt_question_id, given_answer, is_correct) VALUES (?, ?, ?, ?)
     ON CONFLICT (attempt_question_id) DO UPDATE SET given_answer = excluded.given_answer, is_correct = excluded.is_correct`,
    answer.id,
    answer.attemptQuestionId,
    answer.givenAnswer,
    answer.isCorrect === null ? null : toSqlBoolean(answer.isCorrect),
  );
}

/** Starts a scheduled or ready attempt. False if it was already started or finished. */
export async function startAttempt(database: SQLiteDatabase, attemptId: string, now: number): Promise<boolean> {
  const result = await database.runAsync(
    "UPDATE exam_attempts SET status = 'in_progress', started_at = ? WHERE id = ? AND status IN ('scheduled', 'ready')",
    now,
    attemptId,
  );
  return result.changes > 0;
}

export type AttemptResult = { score: number; totalPoints: number; finishedAt: number };

/** Records the score once. A later call (a self-marked essay) updates the score of a finished attempt. */
export async function finishAttempt(database: SQLiteDatabase, attemptId: string, result: AttemptResult): Promise<boolean> {
  const update = await database.runAsync(
    `UPDATE exam_attempts SET status = 'finished', score = ?, total_points = ?, finished_at = IFNULL(finished_at, ?)
      WHERE id = ? AND status IN ('in_progress', 'finished')`,
    result.score,
    result.totalPoints,
    result.finishedAt,
    attemptId,
  );
  return update.changes > 0;
}

/** Remembers the local reminder's id, or clears it with null, so it can be cancelled. */
export async function saveAttemptNotificationId(database: SQLiteDatabase, attemptId: string, notificationId: string | null): Promise<void> {
  await database.runAsync('UPDATE exam_attempts SET notification_id = ? WHERE id = ?', notificationId, attemptId);
}

/** Attempts still waiting for their time, soonest first: Home's upcoming list and reminder rescheduling. */
export async function listScheduledAttempts(database: SQLiteDatabase, page: PageRequest): Promise<ExamAttempt[]> {
  const rows = await database.getAllAsync<AttemptRow>(
    "SELECT * FROM exam_attempts WHERE status = 'scheduled' ORDER BY scheduled_at, id LIMIT ? OFFSET ?",
    page.limit,
    page.offset,
  );
  return rows.map(toAttempt);
}

export type FinishedAttemptItem = ExamAttempt & { examName: string; topicId: string | null };

/** Finished attempts, newest first, with the exam's name: the Progress list. */
export async function listFinishedAttemptsPage(database: SQLiteDatabase, page: PageRequest): Promise<FinishedAttemptItem[]> {
  const rows = await database.getAllAsync<AttemptRow & { exam_name: string; topic_id: string | null }>(
    `SELECT a.*, e.name AS exam_name, e.topic_id
       FROM exam_attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.status = 'finished'
      ORDER BY a.finished_at DESC, a.id
      LIMIT ? OFFSET ?`,
    page.limit,
    page.offset,
  );
  return rows.map((row) => ({ ...toAttempt(row), examName: row.exam_name, topicId: row.topic_id }));
}

export type UpNextAttempt = { attemptId: string; examId: string; examName: string; itemCount: number; scheduledAt: number | null };

/** The soonest scheduled attempt, for Home's "Up next" card. */
export async function findNextScheduledAttempt(database: SQLiteDatabase): Promise<UpNextAttempt | null> {
  const row = await database.getFirstAsync<{ id: string; exam_id: string; name: string; item_count: number; scheduled_at: number | null }>(
    `SELECT a.id, a.exam_id, e.name, e.item_count, a.scheduled_at
       FROM exam_attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.status = 'scheduled'
      ORDER BY a.scheduled_at, a.id
      LIMIT 1`,
  );
  return row ? { attemptId: row.id, examId: row.exam_id, examName: row.name, itemCount: row.item_count, scheduledAt: row.scheduled_at } : null;
}
