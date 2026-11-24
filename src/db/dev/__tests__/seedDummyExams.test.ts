import { describe, expect, it } from 'vitest';
import { listAttemptAnswers, listAttemptQuestions, listAttemptsByExam, findUpNextAttempt } from '../../repositories/attempts';
import { getExam, listReviewedExamsPage } from '../../repositories/exams';
import { insertQuestion } from '../../repositories/questions';
import { insertTopic } from '../../repositories/topics';
import { openMigratedMemoryDatabase } from '../../testing/memoryDatabase';
import { scoreAttempt } from '@/features/exams/scoreAttempt';
import { buildDummyExams } from '../dummyExamData';
import { buildDummyTopics } from '../dummyTopicData';
import { seedDummyExam } from '../seedDummyExams';

const NOW = new Date(2026, 10, 24, 12, 0).getTime();

describe('dummy exam seed (dev only)', () => {
  it('has the mockup\'s three exams with attempts and one scheduled for the near future', () => {
    const exams = buildDummyExams(buildDummyTopics(), NOW);
    expect(exams.map((built) => [built.exam.name, built.attempts.length])).toEqual([
      ['Civil Service — Numerical drill', 22],
      ['LET Gen Ed — English', 12],
      ['Pharmacology quick check', 1],
      ['Numerical drill #5', 1],
    ]);
    const scheduled = exams[3].attempts[0].attempt;
    expect(scheduled.status).toBe('scheduled');
    expect(scheduled.scheduledAt).toBeGreaterThan(NOW);
    expect(scheduled.scheduledAt).toBeLessThan(NOW + 3 * 86_400_000);
  });

  it('is repeatable: the same exams every time', () => {
    expect(buildDummyExams(buildDummyTopics(), NOW)).toEqual(buildDummyExams(buildDummyTopics(), NOW));
  });

  it('writes attempts whose stored score is what scoring gives, with essays marked except the newest quick check', async () => {
    const database = await openMigratedMemoryDatabase();
    const topics = buildDummyTopics();
    for (const topic of topics.slice(0, 3)) {
      await insertTopic(database, { id: topic.id, title: topic.title, subjectLabel: topic.subjectLabel, generalDirections: '', source: 'own', sourceRef: null, createdAt: 1, updatedAt: 1 });
      for (const question of topic.questions) await insertQuestion(database, question, 1);
    }
    for (const built of buildDummyExams(topics, NOW)) await seedDummyExam(database, built);

    const civil = await listAttemptsByExam(database, 'dev-seed-exam-civil');
    expect(civil).toHaveLength(22);
    for (const attempt of [civil[0], civil[21]]) {
      const summary = scoreAttempt(await listAttemptQuestions(database, attempt.id), await listAttemptAnswers(database, attempt.id));
      expect(summary).toMatchObject({ score: attempt.score, totalPoints: attempt.totalPoints, pendingCount: 0 });
    }
    expect(civil[21].score ?? 0).toBeGreaterThan(civil[0].score ?? 0);

    const pharma = await listAttemptsByExam(database, 'dev-seed-exam-pharma');
    const pending = scoreAttempt(await listAttemptQuestions(database, pharma[0].id), await listAttemptAnswers(database, pharma[0].id));
    expect(pending.pendingCount).toBe(2);

    const reviewed = await listReviewedExamsPage(database, { limit: 10, offset: 0 });
    expect(reviewed.map((exam) => exam.name).sort()).toEqual(['Civil Service — Numerical drill', 'LET Gen Ed — English', 'Pharmacology quick check']);
    expect(await findUpNextAttempt(database)).toMatchObject({ examName: 'Numerical drill #5', status: 'scheduled' });
  });

  it('writes an exam again from scratch if an earlier seed was cut short', async () => {
    const database = await openMigratedMemoryDatabase();
    const topics = buildDummyTopics();
    const topic = topics[0];
    await insertTopic(database, { id: topic.id, title: topic.title, subjectLabel: topic.subjectLabel, generalDirections: '', source: 'own', sourceRef: null, createdAt: 1, updatedAt: 1 });
    for (const question of topic.questions) await insertQuestion(database, question, 1);
    const [civil] = buildDummyExams(topics, NOW);
    await seedDummyExam(database, { ...civil, attempts: civil.attempts.slice(0, 3) });
    await seedDummyExam(database, civil);
    expect(await listAttemptsByExam(database, civil.exam.id)).toHaveLength(22);
    expect((await getExam(database, civil.exam.id))?.itemCount).toBe(15);
  });
});
