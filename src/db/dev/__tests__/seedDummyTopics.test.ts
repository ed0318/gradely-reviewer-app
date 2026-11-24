import { describe, expect, it } from 'vitest';
import { findQuestionProblem } from '@/features/questions/questionRules';
import { countQuestionsByType, listQuestionsPage } from '../../repositories/questionList';
import { listTopicsPage } from '../../repositories/topics';
import { openMigratedMemoryDatabase } from '../../testing/memoryDatabase';
import { buildDummyTopics } from '../dummyTopicData';
import { seedDummyTopic } from '../seedDummyTopics';

describe('dummy topic seed (dev only)', () => {
  it('has the mockup\'s three topics and one 500-question topic, each with all four types', () => {
    const topics = buildDummyTopics();
    expect(topics.map((topic) => topic.title)).toEqual(['Civil Service — Numerical', 'LET Gen Ed — English', 'Pharmacology', 'Stress test — 500 questions']);
    expect(topics[3].questions).toHaveLength(500);
    for (const topic of topics) {
      expect(new Set(topic.questions.map((question) => question.type))).toEqual(new Set(['multiple', 'truefalse', 'identification', 'essay']));
    }
  });

  it('is valid by the editor\'s own rules, in section order, with unique ids', () => {
    const rank = { multiple: 0, truefalse: 1, identification: 2, essay: 3 };
    const seenIds = new Set<string>();
    for (const topic of buildDummyTopics()) {
      topic.questions.forEach((question, index) => {
        expect(findQuestionProblem(question), `${topic.id} ${question.id}`).toBeNull();
        expect(question.sortingOrder).toBe(index);
        if (index > 0) expect(rank[question.type]).toBeGreaterThanOrEqual(rank[topic.questions[index - 1].type]);
        expect(seenIds.has(question.id)).toBe(false);
        seenIds.add(question.id);
        if (question.type === 'multiple') for (const choice of question.choices) expect(seenIds.has(choice.id)).toBe(false);
      });
    }
  });

  it('writes through the repositories, once, and skips a topic that is already there', async () => {
    const database = await openMigratedMemoryDatabase();
    const topics = buildDummyTopics();
    const written = [];
    for (const [index, topic] of topics.entries()) written.push(await seedDummyTopic(database, topic, 10_000 - index * 60));
    expect(written).toEqual([true, true, true, true]);
    expect(await seedDummyTopic(database, topics[0], 99_999)).toBe(false);

    const listed = await listTopicsPage(database, { limit: 10, offset: 0 });
    expect(listed.map((topic) => [topic.title, topic.questionCount])).toEqual(topics.map((topic) => [topic.title, topic.questions.length]));
    const counts = await countQuestionsByType(database, 'dev-seed-stress-500');
    expect(counts.multiple + counts.truefalse + counts.identification + counts.essay).toBe(500);
    const firstPage = await listQuestionsPage(database, 'dev-seed-civil-service', { search: '', limit: 5, offset: 0 });
    expect(firstPage[0].question.question).toBe('If 3x + 5 = 20, what is the value of x?');
  });
});
