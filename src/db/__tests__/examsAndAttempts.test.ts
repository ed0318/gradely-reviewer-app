import { describe, expect, it } from 'vitest';
import {
  findNextScheduledAttempt,
  finishAttempt,
  findNextAttemptNumber,
  getAttempt,
  insertAttemptWithQuestions,
  listAttemptAnswers,
  listAttemptQuestions,
  listAttemptsByExam,
  listFinishedAttemptsPage,
  listScheduledAttempts,
  saveAttemptAnswer,
  saveAttemptNotificationId,
  startAttempt,
} from '../repositories/attempts';
import { deleteExam, getExam, insertExamWithFirstAttempt, listExamsByTopic, listExamsPage } from '../repositories/exams';
import { insertQuestion } from '../repositories/questions';
import { deleteTopic, insertTopic } from '../repositories/topics';
import { buildAttempt, buildAttemptQuestions, buildExam, buildOneOfEachType, buildTopic } from '../testing/fixtures';
import { openMigratedMemoryDatabase, type TestDatabase } from '../testing/memoryDatabase';

async function openWithExam(): Promise<TestDatabase> {
  const database = await openMigratedMemoryDatabase();
  await insertTopic(database, buildTopic());
  for (const question of buildOneOfEachType()) await insertQuestion(database, question, 1_000);
  await insertExamWithFirstAttempt(database, buildExam(), buildAttempt(), buildAttemptQuestions());
  return database;
}

const countRows = async (database: TestDatabase, table: string) =>
  (await database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`))?.total;

describe('exams', () => {
  it('saves an exam with its first attempt and copied questions', async () => {
    const database = await openWithExam();
    expect(await getExam(database, 'exam-1')).toEqual(buildExam());
    expect(await getAttempt(database, 'attempt-1')).toEqual(buildAttempt());
    expect(await listAttemptQuestions(database, 'attempt-1')).toEqual(buildAttemptQuestions());
  });

  it('saves nothing when the attempt cannot be saved', async () => {
    const database = await openWithExam();
    // charge-1 is already used: the idempotency key is unique.
    const exam = buildExam({ id: 'exam-2' });
    const attempt = buildAttempt({ id: 'attempt-2', examId: 'exam-2' });
    await expect(insertExamWithFirstAttempt(database, exam, attempt, buildAttemptQuestions('attempt-2'))).rejects.toThrow(/UNIQUE/);
    expect(await getExam(database, 'exam-2')).toBeNull();
  });

  it('refuses more than 100 items', async () => {
    const database = await openWithExam();
    const exam = buildExam({ id: 'exam-2', itemCount: 101 });
    const attempt = buildAttempt({ id: 'attempt-2', examId: 'exam-2', chargeId: 'charge-2' });
    await expect(insertExamWithFirstAttempt(database, exam, attempt, [])).rejects.toThrow(/CHECK/);
  });

  it('lists exams with their latest attempt', async () => {
    const database = await openWithExam();
    await insertAttemptWithQuestions(database, buildAttempt({ id: 'attempt-2', attemptNumber: 2, chargeId: 'charge-2', status: 'scheduled' }), []);
    const [item] = await listExamsPage(database, { limit: 10, offset: 0 });
    expect(item).toMatchObject({ id: 'exam-1', attemptCount: 2, latestStatus: 'scheduled', latestScore: null });
    expect(await listExamsByTopic(database, 'topic-1', { limit: 10, offset: 0 })).toEqual([item]);
    expect(await listExamsByTopic(database, 'other-topic', { limit: 10, offset: 0 })).toEqual([]);
  });

  it('keeps an exam and its scores when the topic is deleted', async () => {
    const database = await openWithExam();
    await deleteTopic(database, 'topic-1');
    expect((await getExam(database, 'exam-1'))?.topicId).toBeNull();
    expect(await listAttemptQuestions(database, 'attempt-1')).toHaveLength(2);
  });

  it('deletes an exam with its attempts, questions and answers', async () => {
    const database = await openWithExam();
    await saveAttemptAnswer(database, { id: 'answer-1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true });
    expect(await deleteExam(database, 'exam-1')).toBe(true);
    for (const table of ['exam_attempts', 'attempt_questions', 'attempt_answers']) {
      expect(await countRows(database, table), table).toBe(0);
    }
  });
});

describe('attempts', () => {
  it('numbers retakes and gives each its own charge', async () => {
    const database = await openWithExam();
    expect(await findNextAttemptNumber(database, 'exam-1')).toBe(2);
    expect(await findNextAttemptNumber(database, 'new-exam')).toBe(1);

    const retake = buildAttempt({ id: 'attempt-2', attemptNumber: 2, chargeId: 'charge-2' });
    await insertAttemptWithQuestions(database, retake, buildAttemptQuestions('attempt-2'));
    expect((await listAttemptsByExam(database, 'exam-1')).map((attempt) => attempt.attemptNumber)).toEqual([1, 2]);

    const sameNumber = buildAttempt({ id: 'attempt-3', attemptNumber: 2, chargeId: 'charge-3' });
    await expect(insertAttemptWithQuestions(database, sameNumber, [])).rejects.toThrow(/UNIQUE/);
  });

  it('starts once, saves answers, and finishes with a score', async () => {
    const database = await openWithExam();
    expect(await startAttempt(database, 'attempt-1', 3_000)).toBe(true);
    expect(await startAttempt(database, 'attempt-1', 3_500)).toBe(false);

    await saveAttemptAnswer(database, { id: 'answer-1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '1', isCorrect: false });
    await saveAttemptAnswer(database, { id: 'answer-1b', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true });
    await saveAttemptAnswer(database, { id: 'answer-2', attemptQuestionId: 'attempt-1-q2', givenAnswer: null, isCorrect: null });
    expect(await listAttemptAnswers(database, 'attempt-1')).toEqual([
      { id: 'answer-1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true },
      { id: 'answer-2', attemptQuestionId: 'attempt-1-q2', givenAnswer: null, isCorrect: null },
    ]);

    expect(await finishAttempt(database, 'attempt-1', { score: 1, totalPoints: 2, finishedAt: 4_000 })).toBe(true);
    // A self-marked essay later updates the score but keeps the finish time.
    expect(await finishAttempt(database, 'attempt-1', { score: 2, totalPoints: 2, finishedAt: 9_000 })).toBe(true);
    expect(await getAttempt(database, 'attempt-1')).toMatchObject({ status: 'finished', score: 2, totalPoints: 2, startedAt: 3_000, finishedAt: 4_000 });
  });

  it('does not finish an attempt that never started', async () => {
    const database = await openWithExam();
    expect(await finishAttempt(database, 'attempt-1', { score: 1, totalPoints: 2, finishedAt: 4_000 })).toBe(false);
  });

  it('lists scheduled attempts soonest first and keeps their reminder ids', async () => {
    const database = await openWithExam();
    await insertAttemptWithQuestions(database, buildAttempt({ id: 'late', attemptNumber: 2, chargeId: 'c2', status: 'scheduled', scheduledAt: 9_000 }), []);
    await insertAttemptWithQuestions(database, buildAttempt({ id: 'soon', attemptNumber: 3, chargeId: 'c3', status: 'scheduled', scheduledAt: 5_000 }), []);
    await saveAttemptNotificationId(database, 'soon', 'notification-1');

    const scheduled = await listScheduledAttempts(database, { limit: 10, offset: 0 });
    expect(scheduled.map((attempt) => [attempt.id, attempt.notificationId])).toEqual([
      ['soon', 'notification-1'],
      ['late', null],
    ]);
  });

  it('lists finished attempts newest first with the exam name', async () => {
    const database = await openWithExam();
    await startAttempt(database, 'attempt-1', 3_000);
    await finishAttempt(database, 'attempt-1', { score: 1, totalPoints: 2, finishedAt: 4_000 });
    await insertAttemptWithQuestions(database, buildAttempt({ id: 'attempt-2', attemptNumber: 2, chargeId: 'charge-2' }), []);
    await startAttempt(database, 'attempt-2', 5_000);
    await finishAttempt(database, 'attempt-2', { score: 2, totalPoints: 2, finishedAt: 6_000 });

    const finished = await listFinishedAttemptsPage(database, { limit: 1, offset: 0 });
    expect(finished).toHaveLength(1);
    expect(finished[0]).toMatchObject({ id: 'attempt-2', examName: 'Cell biology quiz', topicId: 'topic-1', score: 2 });
  });

  it('finds the next scheduled attempt with its exam name for Home', async () => {
    const database = await openWithExam();
    expect(await findNextScheduledAttempt(database)).toBeNull();
    await insertAttemptWithQuestions(database, buildAttempt({ id: 'soon', attemptNumber: 2, chargeId: 'c2', status: 'scheduled', scheduledAt: 5_000 }), []);
    expect(await findNextScheduledAttempt(database)).toEqual({ attemptId: 'soon', examId: 'exam-1', examName: 'Cell biology quiz', itemCount: 2, scheduledAt: 5_000 });
  });
});
