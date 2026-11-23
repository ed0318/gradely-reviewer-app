import type { SQLiteDatabase } from 'expo-sqlite';
import type { AttemptQuestion, AttemptStatus, Exam, ExamAttempt, PageRequest } from '../records';
import { insertAttemptRows } from './attempts';
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
