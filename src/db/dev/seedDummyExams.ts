import type { SQLiteDatabase } from 'expo-sqlite';
import { insertAttemptWithQuestions, saveAttemptAnswer } from '../repositories/attempts';
import { deleteExam, getExam, insertExamWithFirstAttempt } from '../repositories/exams';
import type { DummyExam } from './dummyExamData';

/**
 * DEV ONLY. Writes one dummy exam with its attempts, questions and answers
 * through the same repositories the app uses. An exam left half-written by a
 * seed that was cut short is removed and written again, so a finished seed is
 * always whole. The caller runs each exam in its own `queueWrite`.
 */
export async function seedDummyExam(database: SQLiteDatabase, built: DummyExam): Promise<void> {
  if (await getExam(database, built.exam.id)) await deleteExam(database, built.exam.id);
  const [first, ...later] = built.attempts;
  await insertExamWithFirstAttempt(database, built.exam, first.attempt, first.questions);
  for (const answer of first.answers) await saveAttemptAnswer(database, answer);
  for (const next of later) {
    await insertAttemptWithQuestions(database, next.attempt, next.questions);
    for (const answer of next.answers) await saveAttemptAnswer(database, answer);
  }
}
