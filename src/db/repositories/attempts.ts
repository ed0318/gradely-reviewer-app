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
  source_attempt_id: string | null;
  only_missed: number;
  current_position: number;
  elapsed_seconds: number;
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

type AttemptAnswerRow = { id: string; attempt_question_id: string; given_answer: string | null; is_correct: number | null; is_flagged: number };

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
  sourceAttemptId: row.source_attempt_id,
  onlyMissed: row.only_missed === 1,
  currentPosition: row.current_position,
  elapsedSeconds: row.elapsed_seconds,
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
                                notification_id, started_at, finished_at, score, total_points, status,
                                source_attempt_id, only_missed, current_position, elapsed_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    attempt.sourceAttemptId,
    toSqlBoolean(attempt.onlyMissed),
    attempt.currentPosition,
    attempt.elapsedSeconds,
  );
  await insertQuestionRows(database, attempt.id, questions);
}

async function insertQuestionRows(database: SQLiteDatabase, attemptId: string, questions: AttemptQuestion[]): Promise<void> {
  for (const question of questions) {
    await database.runAsync(
      'INSERT INTO attempt_questions (id, attempt_id, position, type, question, point, answer, choices) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      question.id,
      attemptId,
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
    `SELECT a.id, a.attempt_question_id, a.given_answer, a.is_correct, a.is_flagged
       FROM attempt_answers a JOIN attempt_questions q ON q.id = a.attempt_question_id
      WHERE q.attempt_id = ? ORDER BY q.position`,
    attemptId,
  );
  return rows.map((row) => ({
    id: row.id,
    attemptQuestionId: row.attempt_question_id,
    givenAnswer: row.given_answer,
    isCorrect: row.is_correct === null ? null : row.is_correct === 1,
    isFlagged: row.is_flagged === 1,
  }));
}

/** Saves the answer to one question, replacing an earlier one. The question's flag is left as it was. */
export async function saveAttemptAnswer(database: SQLiteDatabase, answer: AttemptAnswer): Promise<void> {
  await database.runAsync(
    `INSERT INTO attempt_answers (id, attempt_question_id, given_answer, is_correct, is_flagged) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (attempt_question_id) DO UPDATE SET given_answer = excluded.given_answer, is_correct = excluded.is_correct`,
    answer.id,
    answer.attemptQuestionId,
    answer.givenAnswer,
    answer.isCorrect === null ? null : toSqlBoolean(answer.isCorrect),
    toSqlBoolean(answer.isFlagged),
  );
}

/** Flags or unflags a question. A question with no answer yet gets an empty answer row to hold the flag. */
export async function saveAttemptFlag(database: SQLiteDatabase, flag: { id: string; attemptQuestionId: string; isFlagged: boolean }): Promise<void> {
  await database.runAsync(
    `INSERT INTO attempt_answers (id, attempt_question_id, given_answer, is_correct, is_flagged) VALUES (?, ?, NULL, NULL, ?)
     ON CONFLICT (attempt_question_id) DO UPDATE SET is_flagged = excluded.is_flagged`,
    flag.id,
    flag.attemptQuestionId,
    toSqlBoolean(flag.isFlagged),
  );
}

/** Records a self-marked essay: right or wrong. */
export async function saveEssayVerdict(database: SQLiteDatabase, attemptQuestionId: string, isCorrect: boolean): Promise<boolean> {
  const result = await database.runAsync('UPDATE attempt_answers SET is_correct = ? WHERE attempt_question_id = ?', toSqlBoolean(isCorrect), attemptQuestionId);
  return result.changes > 0;
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

export type AttemptResult = { score: number; totalPoints: number; finishedAt: number; elapsedSeconds: number };

/** Finishes an attempt in progress with its score and the time it took. False if it is not in progress. */
export async function finishAttempt(database: SQLiteDatabase, attemptId: string, result: AttemptResult): Promise<boolean> {
  const update = await database.runAsync(
    `UPDATE exam_attempts SET status = 'finished', score = ?, total_points = ?, finished_at = ?, elapsed_seconds = ?
      WHERE id = ? AND status = 'in_progress'`,
    result.score,
    result.totalPoints,
    result.finishedAt,
    result.elapsedSeconds,
    attemptId,
  );
  return update.changes > 0;
}

/** Updates the score of a finished attempt: a self-marked essay changes it. Keeps the finish time. */
export async function saveAttemptScore(database: SQLiteDatabase, attemptId: string, score: { score: number; totalPoints: number }): Promise<boolean> {
  const update = await database.runAsync("UPDATE exam_attempts SET score = ?, total_points = ? WHERE id = ? AND status = 'finished'", score.score, score.totalPoints, attemptId);
  return update.changes > 0;
}

/** Where the student is and how long it has taken, so a killed exam resumes there. */
export async function saveAttemptProgress(database: SQLiteDatabase, attemptId: string, progress: { currentPosition: number; elapsedSeconds: number }): Promise<void> {
  await database.runAsync(
    "UPDATE exam_attempts SET current_position = ?, elapsed_seconds = MAX(elapsed_seconds, ?) WHERE id = ? AND status = 'in_progress'",
    progress.currentPosition,
    progress.elapsedSeconds,
    attemptId,
  );
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

export type UpNextAttempt = {
  attemptId: string;
  examId: string;
  examName: string;
  /** How many questions this attempt has. */
  itemCount: number;
  scheduledAt: number | null;
  status: 'in_progress' | 'ready' | 'scheduled';
};

/**
 * The attempt Home offers next: one already in progress, then one made and
 * waiting to be started, then the soonest scheduled one.
 */
export async function findUpNextAttempt(database: SQLiteDatabase): Promise<UpNextAttempt | null> {
  const row = await database.getFirstAsync<{ id: string; exam_id: string; name: string; item_count: number; scheduled_at: number | null; status: UpNextAttempt['status'] }>(
    `SELECT a.id, a.exam_id, e.name, (SELECT COUNT(*) FROM attempt_questions q WHERE q.attempt_id = a.id) AS item_count, a.scheduled_at, a.status
       FROM exam_attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.status IN ('in_progress', 'ready', 'scheduled')
      ORDER BY CASE a.status WHEN 'in_progress' THEN 0 WHEN 'ready' THEN 1 ELSE 2 END, a.scheduled_at, a.id
      LIMIT 1`,
  );
  return row ? { attemptId: row.id, examId: row.exam_id, examName: row.name, itemCount: row.item_count, scheduledAt: row.scheduled_at, status: row.status } : null;
}

/* The charge flow: an attempt is saved as `charging` before the server is asked. */

/**
 * Saves a charging attempt for an exam that already exists (a retake), giving it
 * the next attempt number. Returns the attempt as saved.
 */
export async function insertChargingAttempt(database: SQLiteDatabase, attempt: ExamAttempt): Promise<ExamAttempt> {
  let saved = attempt;
  await database.withTransactionAsync(async () => {
    saved = { ...attempt, attemptNumber: await findNextAttemptNumber(database, attempt.examId), status: 'charging' };
    await insertAttemptRows(database, saved, []);
  });
  return saved;
}

/**
 * Turns a charged attempt into a real one: copies its questions in and marks it
 * ready or scheduled, in one transaction. False when it is no longer charging
 * (another run finished it first), in which case nothing is written.
 */
export async function completeChargedAttempt(
  database: SQLiteDatabase,
  attemptId: string,
  questions: AttemptQuestion[],
  status: 'ready' | 'scheduled',
): Promise<boolean> {
  let isCompleted = false;
  await database.withTransactionAsync(async () => {
    const update = await database.runAsync("UPDATE exam_attempts SET status = ? WHERE id = ? AND status = 'charging'", status, attemptId);
    if (update.changes === 0) return;
    await insertQuestionRows(database, attemptId, questions);
    isCompleted = true;
  });
  return isCompleted;
}

/**
 * Drops an attempt that was never charged (the server refused). The exam goes
 * with it when that was its only attempt, so a refused first exam leaves nothing.
 */
export async function discardChargingAttempt(database: SQLiteDatabase, attemptId: string): Promise<boolean> {
  let isDiscarded = false;
  await database.withTransactionAsync(async () => {
    const attempt = await database.getFirstAsync<{ exam_id: string }>("SELECT exam_id FROM exam_attempts WHERE id = ? AND status = 'charging'", attemptId);
    if (!attempt) return;
    await database.runAsync('DELETE FROM exam_attempts WHERE id = ?', attemptId);
    await database.runAsync('DELETE FROM exams WHERE id = ? AND NOT EXISTS (SELECT 1 FROM exam_attempts WHERE exam_id = ?)', attempt.exam_id, attempt.exam_id);
    isDiscarded = true;
  });
  return isDiscarded;
}

/** A retake of this attempt that is still waiting to be charged, so pressing Retake again reuses its key instead of making a second one. */
export async function findChargingRetake(database: SQLiteDatabase, examId: string, sourceAttemptId: string, onlyMissed: boolean): Promise<ExamAttempt | null> {
  const row = await database.getFirstAsync<AttemptRow>(
    "SELECT * FROM exam_attempts WHERE exam_id = ? AND source_attempt_id = ? AND only_missed = ? AND status = 'charging' ORDER BY attempt_number LIMIT 1",
    examId,
    sourceAttemptId,
    toSqlBoolean(onlyMissed),
  );
  return row ? toAttempt(row) : null;
}

/** Charging attempts, oldest first: the ones to settle when the app opens. */
export async function listChargingAttemptIds(database: SQLiteDatabase): Promise<string[]> {
  const rows = await database.getAllAsync<{ id: string }>(
    "SELECT a.id FROM exam_attempts a JOIN exams e ON e.id = a.exam_id WHERE a.status = 'charging' ORDER BY e.created_at, a.attempt_number, a.id",
  );
  return rows.map((row) => row.id);
}

export async function countChargingAttempts(database: SQLiteDatabase): Promise<number> {
  const row = await database.getFirstAsync<{ total: number }>("SELECT COUNT(*) AS total FROM exam_attempts WHERE status = 'charging'");
  return row?.total ?? 0;
}

/** The reminders an exam has set, so deleting the exam can cancel them first. */
export async function listAttemptNotificationIds(database: SQLiteDatabase, examId: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ notification_id: string }>('SELECT notification_id FROM exam_attempts WHERE exam_id = ? AND notification_id IS NOT NULL', examId);
  return rows.map((row) => row.notification_id);
}

export type RemindableAttempt = { attemptId: string; examName: string; itemCount: number; scheduledAt: number; remindMinutesBefore: number; notificationId: string | null };

/** Scheduled attempts that want a reminder, soonest first: what the phone should be holding. */
export async function listRemindableAttempts(database: SQLiteDatabase, limit: number): Promise<RemindableAttempt[]> {
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    item_count: number;
    scheduled_at: number;
    remind_minutes_before: number;
    notification_id: string | null;
  }>(
    `SELECT a.id, e.name, (SELECT COUNT(*) FROM attempt_questions q WHERE q.attempt_id = a.id) AS item_count, a.scheduled_at, a.remind_minutes_before, a.notification_id
       FROM exam_attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.status = 'scheduled' AND a.scheduled_at IS NOT NULL AND a.remind_minutes_before IS NOT NULL
      ORDER BY a.scheduled_at, a.id
      LIMIT ?`,
    limit,
  );
  return rows.map((row) => ({
    attemptId: row.id,
    examName: row.name,
    itemCount: row.item_count,
    scheduledAt: row.scheduled_at,
    remindMinutesBefore: row.remind_minutes_before,
    notificationId: row.notification_id,
  }));
}

export type AttemptScore = { score: number; totalPoints: number };

/** The finished attempt just before this number, for "+2 from last time". */
export async function findPreviousFinishedAttempt(database: SQLiteDatabase, examId: string, beforeAttemptNumber: number): Promise<AttemptScore | null> {
  const row = await database.getFirstAsync<{ score: number; total_points: number }>(
    `SELECT score, total_points FROM exam_attempts
      WHERE exam_id = ? AND status = 'finished' AND attempt_number < ? AND score IS NOT NULL AND total_points IS NOT NULL
      ORDER BY attempt_number DESC LIMIT 1`,
    examId,
    beforeAttemptNumber,
  );
  return row ? { score: row.score, totalPoints: row.total_points } : null;
}

/** The best finished attempt of the exam other than this one, by share of points. */
export async function findBestOtherFinishedAttempt(database: SQLiteDatabase, examId: string, exceptAttemptId: string): Promise<AttemptScore | null> {
  const row = await database.getFirstAsync<{ score: number; total_points: number }>(
    `SELECT score, total_points FROM exam_attempts
      WHERE exam_id = ? AND status = 'finished' AND id <> ? AND total_points > 0 AND score IS NOT NULL
      ORDER BY score * 1.0 / total_points DESC LIMIT 1`,
    examId,
    exceptAttemptId,
  );
  return row ? { score: row.score, totalPoints: row.total_points } : null;
}
