import { describe, expect, it } from 'vitest';
import { MIGRATIONS } from '../migrations';
import { runMigrations } from '../runMigrations';
import {
  completeChargedAttempt,
  countChargingAttempts,
  discardChargingAttempt,
  findBestOtherFinishedAttempt,
  findChargingRetake,
  findPreviousFinishedAttempt,
  finishAttempt,
  getAttempt,
  insertChargingAttempt,
  listAttemptAnswers,
  listAttemptNotificationIds,
  listAttemptQuestions,
  listChargingAttemptIds,
  listRemindableAttempts,
  saveAttemptAnswer,
  saveAttemptFlag,
  saveAttemptNotificationId,
  saveAttemptProgress,
  saveAttemptScore,
  saveEssayVerdict,
  startAttempt,
} from '../repositories/attempts';
import { countExamAttempts, getAttemptWithExam, getExam, insertChargingExam, insertExamWithFirstAttempt, listReviewedExamsPage } from '../repositories/exams';
import { insertTopic } from '../repositories/topics';
import { buildAttempt, buildAttemptQuestions, buildExam, buildTopic } from '../testing/fixtures';
import { openMemoryDatabase, openMigratedMemoryDatabase, type TestDatabase } from '../testing/memoryDatabase';

async function openWithTopic(): Promise<TestDatabase> {
  const database = await openMigratedMemoryDatabase();
  await insertTopic(database, buildTopic());
  return database;
}

describe('migration 002 (charging attempts)', () => {
  it('keeps every attempt, question and answer already on the phone, and cascades still work', async () => {
    const database = openMemoryDatabase();
    await runMigrations(database, MIGRATIONS.slice(0, 1));
    await insertTopic(database, buildTopic());
    // Written with the version 1 columns only, as an installed phone has them.
    await database.runAsync('INSERT INTO exams (id, topic_id, name, item_count, shuffle_questions, shuffle_choices, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', 'exam-1', 'topic-1', 'Cell biology quiz', 2, 1, 0, 2_000);
    await database.runAsync(
      `INSERT INTO exam_attempts (id, exam_id, attempt_number, charge_id, units_charged, started_at, finished_at, score, total_points, status)
       VALUES ('attempt-1', 'exam-1', 1, 'charge-1', 2, 5, 9, 1, 2, 'finished')`,
    );
    for (const question of buildAttemptQuestions()) {
      await database.runAsync('INSERT INTO attempt_questions (id, attempt_id, position, type, question, point, answer, choices) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', question.id, 'attempt-1', question.position, question.type, question.question, question.point, question.answer, question.choices === null ? null : JSON.stringify(question.choices));
    }
    await database.runAsync('INSERT INTO attempt_answers (id, attempt_question_id, given_answer, is_correct) VALUES (?, ?, ?, ?)', 'answer-1', 'attempt-1-q1', '0', 1);

    await runMigrations(database, MIGRATIONS);

    expect(await getAttempt(database, 'attempt-1')).toMatchObject({ status: 'finished', score: 1, totalPoints: 2, startedAt: 5, finishedAt: 9, chargeId: 'charge-1', sourceAttemptId: null, onlyMissed: false, currentPosition: 0, elapsedSeconds: 0 });
    expect(await listAttemptQuestions(database, 'attempt-1')).toEqual(buildAttemptQuestions());
    expect(await listAttemptAnswers(database, 'attempt-1')).toEqual([{ id: 'answer-1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true, isFlagged: false }]);
    // Foreign keys and cascades survived the rebuild; the work tables are gone.
    await database.runAsync('DELETE FROM exams');
    expect((await database.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM attempt_questions'))?.total).toBe(0);
    const names = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE name LIKE 'migrating_%'");
    expect(names).toEqual([]);
  });

  it('accepts the charging status and still refuses an unknown one', async () => {
    const database = await openWithTopic();
    await insertChargingExam(database, buildExam(), buildAttempt({ status: 'ready' }));
    expect((await getAttempt(database, 'attempt-1'))?.status).toBe('charging');
    await expect(database.runAsync("UPDATE exam_attempts SET status = 'nonsense' WHERE id = 'attempt-1'")).rejects.toThrow(/CHECK/);
  });
});

describe('the charge flow in the database', () => {
  it('saves an exam as charging with no questions, and lists it to settle', async () => {
    const database = await openWithTopic();
    await insertChargingExam(database, buildExam(), buildAttempt({ unitsCharged: 2 }));
    expect(await listChargingAttemptIds(database)).toEqual(['attempt-1']);
    expect(await countChargingAttempts(database)).toBe(1);
    expect(await listAttemptQuestions(database, 'attempt-1')).toEqual([]);
  });

  it('completes a charged attempt once: questions copied and status set together', async () => {
    const database = await openWithTopic();
    await insertChargingExam(database, buildExam(), buildAttempt({ scheduledAt: 5_000, remindMinutesBefore: 30 }));
    expect(await completeChargedAttempt(database, 'attempt-1', buildAttemptQuestions(), 'scheduled')).toBe(true);
    expect(await getAttempt(database, 'attempt-1')).toMatchObject({ status: 'scheduled', scheduledAt: 5_000 });
    expect(await listAttemptQuestions(database, 'attempt-1')).toHaveLength(2);
    // A second run (the app-open retry racing the screen) writes nothing.
    expect(await completeChargedAttempt(database, 'attempt-1', buildAttemptQuestions(), 'ready')).toBe(false);
    expect(await listAttemptQuestions(database, 'attempt-1')).toHaveLength(2);
    expect(await countChargingAttempts(database)).toBe(0);
  });

  it('rolls the status back when the questions cannot be copied', async () => {
    const database = await openWithTopic();
    await insertChargingExam(database, buildExam(), buildAttempt());
    const duplicated = [...buildAttemptQuestions(), ...buildAttemptQuestions()];
    await expect(completeChargedAttempt(database, 'attempt-1', duplicated, 'ready')).rejects.toThrow();
    expect((await getAttempt(database, 'attempt-1'))?.status).toBe('charging');
  });

  it('drops a refused first exam with its attempt, but only the refused retake of an old exam', async () => {
    const database = await openWithTopic();
    await insertChargingExam(database, buildExam(), buildAttempt());
    expect(await discardChargingAttempt(database, 'attempt-1')).toBe(true);
    expect(await getExam(database, 'exam-1')).toBeNull();

    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'finished' }), buildAttemptQuestions());
    const retake = await insertChargingAttempt(database, buildAttempt({ id: 'attempt-2', chargeId: 'charge-2', sourceAttemptId: 'attempt-1' }));
    expect(retake.attemptNumber).toBe(2);
    expect(await discardChargingAttempt(database, 'attempt-2')).toBe(true);
    expect(await getExam(database, 'exam-1')).not.toBeNull();
    expect(await getAttempt(database, 'attempt-1')).not.toBeNull();
  });

  it('never discards an attempt that was charged', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'ready' }), buildAttemptQuestions());
    expect(await discardChargingAttempt(database, 'attempt-1')).toBe(false);
    expect(await getAttempt(database, 'attempt-1')).not.toBeNull();
  });

  it('finds a retake still waiting, so pressing Retake again reuses its key', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'finished' }), buildAttemptQuestions());
    await insertChargingAttempt(database, buildAttempt({ id: 'attempt-2', chargeId: 'charge-2', sourceAttemptId: 'attempt-1', onlyMissed: true, unitsCharged: 1 }));
    expect((await findChargingRetake(database, 'exam-1', 'attempt-1', true))?.chargeId).toBe('charge-2');
    expect(await findChargingRetake(database, 'exam-1', 'attempt-1', false)).toBeNull();
  });

  it('numbers the retake after the last attempt', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'finished' }), buildAttemptQuestions());
    expect((await insertChargingAttempt(database, buildAttempt({ id: 'a2', chargeId: 'c2' }))).attemptNumber).toBe(2);
    expect((await insertChargingAttempt(database, buildAttempt({ id: 'a3', chargeId: 'c3', sourceAttemptId: 'attempt-1' }))).attemptNumber).toBe(3);
  });
});

describe('taking an attempt', () => {
  async function openInProgress() {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt(), buildAttemptQuestions());
    await startAttempt(database, 'attempt-1', 1_000);
    return database;
  }

  it('keeps the position and the time, so a killed exam resumes there', async () => {
    const database = await openInProgress();
    await saveAttemptProgress(database, 'attempt-1', { currentPosition: 1, elapsedSeconds: 75 });
    await saveAttemptProgress(database, 'attempt-1', { currentPosition: 0, elapsedSeconds: 60 });
    // The time only ever goes up, even if a stale save arrives late.
    expect(await getAttempt(database, 'attempt-1')).toMatchObject({ currentPosition: 0, elapsedSeconds: 75 });
  });

  it('flags a question with no answer yet, and an answer keeps its flag', async () => {
    const database = await openInProgress();
    await saveAttemptFlag(database, { id: 'f1', attemptQuestionId: 'attempt-1-q1', isFlagged: true });
    await saveAttemptAnswer(database, { id: 'a1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true, isFlagged: false });
    expect(await listAttemptAnswers(database, 'attempt-1')).toEqual([{ id: 'f1', attemptQuestionId: 'attempt-1-q1', givenAnswer: '0', isCorrect: true, isFlagged: true }]);
    await saveAttemptFlag(database, { id: 'f2', attemptQuestionId: 'attempt-1-q1', isFlagged: false });
    expect((await listAttemptAnswers(database, 'attempt-1'))[0].isFlagged).toBe(false);
  });

  it('marks an essay and updates the score of a finished attempt only', async () => {
    const database = await openInProgress();
    await saveAttemptAnswer(database, { id: 'a1', attemptQuestionId: 'attempt-1-q1', givenAnswer: 'text', isCorrect: null, isFlagged: false });
    expect(await saveAttemptScore(database, 'attempt-1', { score: 1, totalPoints: 1 })).toBe(false);
    await finishAttempt(database, 'attempt-1', { score: 0, totalPoints: 1, finishedAt: 2_000, elapsedSeconds: 10 });
    expect(await saveEssayVerdict(database, 'attempt-1-q1', true)).toBe(true);
    expect(await saveAttemptScore(database, 'attempt-1', { score: 1, totalPoints: 2 })).toBe(true);
    expect((await listAttemptAnswers(database, 'attempt-1'))[0].isCorrect).toBe(true);
    expect(await getAttempt(database, 'attempt-1')).toMatchObject({ score: 1, totalPoints: 2, finishedAt: 2_000 });
  });
});

describe('what Home and Results read', () => {
  it('lists reviewed exams with best score, attempts and the last one, newest first', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'finished', score: 24, totalPoints: 30, finishedAt: 100 }), buildAttemptQuestions());
    await insertChargingAttempt(database, buildAttempt({ id: 'attempt-2', chargeId: 'charge-2' }));
    await completeChargedAttempt(database, 'attempt-2', buildAttemptQuestions('attempt-2'), 'ready');
    await startAttempt(database, 'attempt-2', 150);
    await finishAttempt(database, 'attempt-2', { score: 20, totalPoints: 30, finishedAt: 200, elapsedSeconds: 5 });
    await insertExamWithFirstAttempt(database, buildExam({ id: 'exam-2', name: 'Never taken' }), buildAttempt({ id: 'b1', examId: 'exam-2', chargeId: 'c-b1', status: 'ready' }), buildAttemptQuestions('b1'));

    const reviewed = await listReviewedExamsPage(database, { limit: 10, offset: 0 });
    expect(reviewed).toHaveLength(1);
    expect(reviewed[0]).toMatchObject({ examId: 'exam-1', finishedAttemptCount: 2, lastAttemptId: 'attempt-2', lastScore: 20, lastTotalPoints: 30 });
    expect(reviewed[0].bestFraction).toBeCloseTo(0.8);
  });

  it('finds the previous and the best other attempt for "+2 from last time"', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'finished', score: 26, totalPoints: 30, finishedAt: 100 }), buildAttemptQuestions());
    for (const [number, score] of [[2, 20], [3, 24]] as const) {
      await insertChargingAttempt(database, buildAttempt({ id: `attempt-${number}`, chargeId: `charge-${number}` }));
      await completeChargedAttempt(database, `attempt-${number}`, buildAttemptQuestions(`attempt-${number}`), 'ready');
      await startAttempt(database, `attempt-${number}`, number * 100);
      await finishAttempt(database, `attempt-${number}`, { score, totalPoints: 30, finishedAt: number * 100 + 50, elapsedSeconds: 1 });
    }
    expect(await findPreviousFinishedAttempt(database, 'exam-1', 3)).toEqual({ score: 20, totalPoints: 30 });
    expect(await findPreviousFinishedAttempt(database, 'exam-1', 1)).toBeNull();
    expect(await findBestOtherFinishedAttempt(database, 'exam-1', 'attempt-3')).toEqual({ score: 26, totalPoints: 30 });
    expect(await countExamAttempts(database, 'exam-1')).toBe(3);
    expect((await getAttemptWithExam(database, 'attempt-3'))?.exam.name).toBe('Cell biology quiz');
    expect(await getAttemptWithExam(database, 'missing')).toBeNull();
  });

  it('lists the scheduled attempts that want a reminder, with their item count and reminder id', async () => {
    const database = await openWithTopic();
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt({ status: 'scheduled', scheduledAt: 5_000, remindMinutesBefore: 30 }), buildAttemptQuestions());
    await insertExamWithFirstAttempt(database, buildExam({ id: 'exam-2' }), buildAttempt({ id: 'b', examId: 'exam-2', chargeId: 'c-b', status: 'scheduled', scheduledAt: 4_000, remindMinutesBefore: null }), buildAttemptQuestions('b'));
    await saveAttemptNotificationId(database, 'attempt-1', 'note-1');

    expect(await listRemindableAttempts(database, 10)).toEqual([
      { attemptId: 'attempt-1', examName: 'Cell biology quiz', itemCount: 2, scheduledAt: 5_000, remindMinutesBefore: 30, notificationId: 'note-1' },
    ]);
    expect(await listAttemptNotificationIds(database, 'exam-1')).toEqual(['note-1']);
    expect(await listAttemptNotificationIds(database, 'exam-2')).toEqual([]);
  });
});
