import type { SQLiteBindValue } from 'expo-sqlite';
import { describe, expect, it } from 'vitest';
import { insertAttemptWithQuestions } from '../repositories/attempts';
import { insertExamWithFirstAttempt } from '../repositories/exams';
import { getExamProgressStats, listFinishedAttemptScoresPage, listLatestFinishedScores, listProgressExams } from '../repositories/progress';
import { insertTopic } from '../repositories/topics';
import { buildAttempt, buildExam, buildTopic } from '../testing/fixtures';
import { openMigratedMemoryDatabase, type TestDatabase } from '../testing/memoryDatabase';

type Sitting = { score: number; totalPoints: number; elapsedSeconds?: number; status?: 'finished' | 'scheduled' | 'in_progress' };

/** An exam whose attempts are numbered from 1 in the order given, one day apart, each finished a day after the one before. */
async function addExam(database: TestDatabase, examId: string, sittings: Sitting[], overrides: { name?: string; topicId?: string | null; createdAt?: number } = {}) {
  await insertExamWithFirstAttempt(database, buildExam({ id: examId, name: overrides.name ?? examId, topicId: overrides.topicId === undefined ? 'topic-1' : overrides.topicId, createdAt: overrides.createdAt ?? 1 }), buildSitting(examId, 1, sittings[0]), []);
  for (let index = 1; index < sittings.length; index += 1) await insertAttemptWithQuestions(database, buildSitting(examId, index + 1, sittings[index]), []);
}

function buildSitting(examId: string, number: number, sitting: Sitting) {
  const status = sitting.status ?? 'finished';
  return buildAttempt({
    id: `${examId}:a${number}`,
    examId,
    attemptNumber: number,
    chargeId: `${examId}:charge${number}`,
    status,
    startedAt: status === 'scheduled' ? null : number * 86_400_000,
    finishedAt: status === 'finished' ? number * 86_400_000 + 600_000 : null,
    score: status === 'finished' ? sitting.score : null,
    totalPoints: status === 'finished' ? sitting.totalPoints : null,
    elapsedSeconds: sitting.elapsedSeconds ?? 0,
  });
}

async function openWithTopic(): Promise<TestDatabase> {
  const database = await openMigratedMemoryDatabase();
  await insertTopic(database, buildTopic());
  return database;
}

describe('progress stats', () => {
  it('gives best, average and tries over points, not counts of right answers', async () => {
    const database = await openWithTopic();
    // 5/10 = 50%, 9/10 = 90%, and an essay-heavy exam: 15/20 = 75%.
    await addExam(database, 'exam-1', [
      { score: 5, totalPoints: 10 },
      { score: 9, totalPoints: 10 },
      { score: 15, totalPoints: 20 },
    ]);
    const stats = await getExamProgressStats(database, 'exam-1');
    expect(stats.tries).toBe(3);
    expect(stats.bestFraction).toBeCloseTo(0.9);
    expect(stats.averageFraction).toBeCloseTo((0.5 + 0.9 + 0.75) / 3);
  });

  it('ignores scheduled and unfinished attempts', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', [
      { score: 6, totalPoints: 10 },
      { score: 0, totalPoints: 0, status: 'in_progress' },
      { score: 0, totalPoints: 0, status: 'scheduled' },
    ]);
    const stats = await getExamProgressStats(database, 'exam-1');
    expect(stats).toEqual({ tries: 1, bestFraction: 0.6, averageFraction: 0.6 });
  });

  it('is empty for an exam with no finished attempt, and for another exam\'s attempts', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', [{ score: 0, totalPoints: 0, status: 'scheduled' }]);
    await addExam(database, 'exam-2', [{ score: 10, totalPoints: 10 }]);
    expect(await getExamProgressStats(database, 'exam-1')).toEqual({ tries: 0, bestFraction: null, averageFraction: null });
    expect((await getExamProgressStats(database, 'exam-2')).tries).toBe(1);
  });

  it('counts an attempt worth no points as a try but leaves it out of best and average', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', [
      { score: 0, totalPoints: 0 },
      { score: 8, totalPoints: 10 },
    ]);
    expect(await getExamProgressStats(database, 'exam-1')).toEqual({ tries: 2, bestFraction: 0.8, averageFraction: 0.8 });
  });
});

describe('last scores and attempts page', () => {
  const twentyThree: Sitting[] = Array.from({ length: 23 }, (_, index) => ({ score: index + 1, totalPoints: 30, elapsedSeconds: 600 + index }));

  it('returns the newest six finished attempts, newest first, skipping an unfinished newer one', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', [...twentyThree, { score: 0, totalPoints: 0, status: 'scheduled' }]);
    const latest = await listLatestFinishedScores(database, 'exam-1', 6);
    expect(latest.map((attempt) => attempt.attemptNumber)).toEqual([23, 22, 21, 20, 19, 18]);
    expect(latest[0]).toEqual({ attemptNumber: 23, finishedAt: 23 * 86_400_000 + 600_000, score: 23, totalPoints: 30, elapsedSeconds: 622 });
  });

  it('returns fewer than six when the exam has fewer', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', twentyThree.slice(0, 2));
    expect((await listLatestFinishedScores(database, 'exam-1', 6)).map((attempt) => attempt.attemptNumber)).toEqual([2, 1]);
  });

  it('pages ten at a time, newest first, with a short last page', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', twentyThree);
    const pageOne = await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 0 });
    const pageTwo = await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 10 });
    const pageThree = await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 20 });
    expect(pageOne.map((attempt) => attempt.attemptNumber)).toEqual([23, 22, 21, 20, 19, 18, 17, 16, 15, 14]);
    expect(pageTwo.map((attempt) => attempt.attemptNumber)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5, 4]);
    expect(pageThree.map((attempt) => attempt.attemptNumber)).toEqual([3, 2, 1]);
    expect(await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 30 })).toEqual([]);
  });

  it('breaks a tie on the finish time by the attempt number, so a page never repeats a row', async () => {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', [{ score: 1, totalPoints: 2 }]);
    await insertAttemptWithQuestions(database, { ...buildSitting('exam-1', 2, { score: 2, totalPoints: 2 }), finishedAt: 1 * 86_400_000 + 600_000 }, []);
    const page = await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 0 });
    expect(page.map((attempt) => attempt.attemptNumber)).toEqual([2, 1]);
  });
});

describe('progress exams (the picker)', () => {
  it('lists exams with a finished attempt, most recently taken first, with tries, best and topic', async () => {
    const database = await openWithTopic();
    await addExam(database, 'older', [{ score: 5, totalPoints: 10 }], { name: 'Older exam' });
    await addExam(database, 'newer', [{ score: 1, totalPoints: 10 }, { score: 9, totalPoints: 10 }], { name: 'Newer exam', topicId: null });
    await addExam(database, 'not-yet', [{ score: 0, totalPoints: 0, status: 'scheduled' }]);
    // The newer exam's attempts finish later only if its numbers are higher; push 'older' back in time.
    await database.runAsync("UPDATE exam_attempts SET finished_at = 1 WHERE exam_id = 'older'");
    expect(await listProgressExams(database)).toEqual([
      { examId: 'newer', name: 'Newer exam', topicTitle: null, tries: 2, bestFraction: 0.9 },
      { examId: 'older', name: 'Older exam', topicTitle: 'Cell biology', tries: 1, bestFraction: 0.5 },
    ]);
  });
});

describe('progress query plans and speed', () => {
  async function openWithTwoHundred(): Promise<TestDatabase> {
    const database = await openWithTopic();
    await addExam(database, 'exam-1', Array.from({ length: 200 }, (_, index) => ({ score: index % 31, totalPoints: 30, elapsedSeconds: 300 + index })));
    return database;
  }

  it('reads one exam through the exam_attempts(exam_id, finished_at) index, in all three queries', async () => {
    const database = await openWithTwoHundred();
    // Record the SQL the repository really sends, then ask SQLite how it would run each.
    const sent: Array<{ sql: string; params: SQLiteBindValue[] }> = [];
    const readOne = database.getFirstAsync.bind(database);
    const readAll = database.getAllAsync.bind(database);
    database.getFirstAsync = ((sql: string, ...params: SQLiteBindValue[]) => (sent.push({ sql, params }), readOne(sql, ...params))) as typeof database.getFirstAsync;
    database.getAllAsync = ((sql: string, ...params: SQLiteBindValue[]) => (sent.push({ sql, params }), readAll(sql, ...params))) as typeof database.getAllAsync;
    await getExamProgressStats(database, 'exam-1');
    await listLatestFinishedScores(database, 'exam-1', 6);
    await listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 20 });
    expect(sent).toHaveLength(3);
    for (const { sql, params } of sent) {
      const detail = (database.raw.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as Array<{ detail: string }>).map((row) => row.detail).join(' | ');
      expect(detail).toContain('USING INDEX exam_attempts__exam_finished');
      expect(detail).not.toContain('exam_attempts__status_finished');
      expect(detail).not.toContain('SCAN exam_attempts');
    }
  });

  it('opens an exam with 200 attempts well inside 200 ms (stats, last six and a page)', async () => {
    const database = await openWithTwoHundred();
    const started = performance.now();
    const [stats, latest, page] = await Promise.all([
      getExamProgressStats(database, 'exam-1'),
      listLatestFinishedScores(database, 'exam-1', 6),
      listFinishedAttemptScoresPage(database, 'exam-1', { limit: 10, offset: 0 }),
    ]);
    const elapsed = performance.now() - started;
    expect(stats.tries).toBe(200);
    expect(latest).toHaveLength(6);
    expect(page).toHaveLength(10);
    expect(elapsed).toBeLessThan(200);
  });
});
