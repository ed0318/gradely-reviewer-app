import { describe, expect, it } from 'vitest';
import { countExamsByTopic, getExam, insertExamWithFirstAttempt } from '../repositories/exams';
import { listAttemptQuestions } from '../repositories/attempts';
import { moveQuestionWithinSection, getQuestionPlace } from '../repositories/questionOrder';
import { buildLikePattern, countQuestionsByType, listQuestionsPage } from '../repositories/questionList';
import {
  deleteQuestion,
  insertQuestionInSection,
  listQuestionIdsByTopic,
  restoreQuestion,
  saveEditedQuestion,
  getQuestion,
} from '../repositories/questions';
import { deleteTopic, insertTopic } from '../repositories/topics';
import type { TopicQuestion } from '../records';
import { buildAttempt, buildAttemptQuestions, buildExam, buildMultipleQuestion, buildTopic } from '../testing/fixtures';
import { openMigratedMemoryDatabase } from '../testing/memoryDatabase';

const NOW = 5_000;

const truefalse = (id: string, question = 'Plant cells have walls.'): TopicQuestion => ({ id, topicId: 'topic-1', question, point: 1, sortingOrder: 0, type: 'truefalse', answerIsTrue: true });
const identification = (id: string, answer = 'Mitochondrion', question = 'The powerhouse of the cell.'): TopicQuestion => ({ id, topicId: 'topic-1', question, point: 1, sortingOrder: 0, type: 'identification', answer });

async function openWithTopic() {
  const database = await openMigratedMemoryDatabase();
  await insertTopic(database, buildTopic());
  return database;
}

/** Ids in topic order, with the types, to read the order at a glance. */
async function readOrder(database: Awaited<ReturnType<typeof openWithTopic>>) {
  const rows = await listQuestionsPage(database, 'topic-1', { search: '', limit: 1000, offset: 0 });
  return rows.map((row) => row.question.id);
}

describe('adding a question to its section', () => {
  it('goes at the end of its own section and keeps the topic in section order', async () => {
    const database = await openWithTopic();
    await insertQuestionInSection(database, identification('id-1'), NOW);
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1' }), NOW);
    await insertQuestionInSection(database, truefalse('tf-1'), NOW);
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-2' }), NOW);
    await insertQuestionInSection(database, identification('id-2'), NOW);

    expect(await readOrder(database)).toEqual(['mc-1', 'mc-2', 'tf-1', 'id-1', 'id-2']);
    const numbers = (await listQuestionsPage(database, 'topic-1', { search: '', limit: 10, offset: 0 })).map((row) => row.number);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns the question with the place it was given, and touches the topic', async () => {
    const database = await openWithTopic();
    const placed = await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1', sortingOrder: 99 }), NOW);
    expect(placed.sortingOrder).toBe(0);
    expect(await database.getFirstAsync('SELECT updated_at FROM topics WHERE id = ?', 'topic-1')).toEqual({ updated_at: NOW });
  });
});

describe('Undo', () => {
  it('puts a deleted question back in its place with its key, even after the list moved on', async () => {
    const database = await openWithTopic();
    for (const question of [buildMultipleQuestion({ id: 'mc-1' }), buildMultipleQuestion({ id: 'mc-2' }), buildMultipleQuestion({ id: 'mc-3' })]) {
      await insertQuestionInSection(database, question, NOW);
    }
    const deleted = await deleteQuestion(database, 'mc-2', NOW);
    expect(await readOrder(database)).toEqual(['mc-1', 'mc-3']);

    // Something is added to the same section while the toast is up.
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-4' }), NOW);
    await restoreQuestion(database, deleted!, NOW);

    expect(await readOrder(database)).toEqual(['mc-1', 'mc-2', 'mc-3', 'mc-4']);
    expect(await getQuestion(database, 'mc-2')).toEqual(deleted);
  });
});

describe('saving what the editor holds', () => {
  it('keeps the place the database has, not the stale one the editor read', async () => {
    const database = await openWithTopic();
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1' }), NOW);
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-2' }), NOW);
    const staleCopy = (await getQuestion(database, 'mc-1'))!;
    await moveQuestionWithinSection(database, 'mc-1', 1, NOW);

    const saved = await saveEditedQuestion(database, { ...staleCopy, question: 'Reworded' }, NOW);
    expect(saved?.sortingOrder).toBe(1);
    expect(await readOrder(database)).toEqual(['mc-2', 'mc-1']);
    expect((await getQuestion(database, 'mc-1'))?.question).toBe('Reworded');
  });

  it('sends a retyped question to the end of its new section', async () => {
    const database = await openWithTopic();
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1' }), NOW);
    await insertQuestionInSection(database, truefalse('tf-1'), NOW);
    await insertQuestionInSection(database, truefalse('tf-2'), NOW);
    await insertQuestionInSection(database, identification('id-1'), NOW);

    const asTrueFalse = { ...(await getQuestion(database, 'mc-1'))!, type: 'truefalse' as const, answerIsTrue: false };
    await saveEditedQuestion(database, asTrueFalse as unknown as TopicQuestion, NOW);
    expect(await readOrder(database)).toEqual(['tf-1', 'tf-2', 'mc-1', 'id-1']);
    expect(await getQuestion(database, 'mc-1')).toMatchObject({ type: 'truefalse', answerIsTrue: false });
    // The old choices are gone with the old type.
    expect(await database.getFirstAsync('SELECT COUNT(*) AS total FROM topic_question_answer_multiple')).toEqual({ total: 0 });

    // And back, into an empty section, between the sections around it.
    const asIdentification = { ...(await getQuestion(database, 'tf-1'))!, type: 'identification' as const, answer: 'x' };
    await saveEditedQuestion(database, asIdentification as unknown as TopicQuestion, NOW);
    expect(await readOrder(database)).toEqual(['tf-2', 'mc-1', 'id-1', 'tf-1']);
  });

  it('returns null for a question that is gone', async () => {
    const database = await openWithTopic();
    expect(await saveEditedQuestion(database, buildMultipleQuestion({ id: 'ghost' }), NOW)).toBeNull();
  });
});

describe('Move up and Move down', () => {
  it('swaps with the neighbour inside the section and stops at its edges', async () => {
    const database = await openWithTopic();
    for (const question of [buildMultipleQuestion({ id: 'mc-1' }), buildMultipleQuestion({ id: 'mc-2' }), truefalse('tf-1')]) {
      await insertQuestionInSection(database, question, NOW);
    }
    expect(await moveQuestionWithinSection(database, 'mc-1', -1, NOW)).toBe(false);
    expect(await moveQuestionWithinSection(database, 'mc-2', 1, NOW)).toBe(false);
    expect(await moveQuestionWithinSection(database, 'tf-1', -1, NOW)).toBe(false);
    expect(await moveQuestionWithinSection(database, 'mc-2', -1, NOW)).toBe(true);
    expect(await readOrder(database)).toEqual(['mc-2', 'mc-1', 'tf-1']);
    expect(await moveQuestionWithinSection(database, 'missing', 1, NOW)).toBe(false);
  });

  it('reports a question\'s number and its place in its section', async () => {
    const database = await openWithTopic();
    for (const question of [buildMultipleQuestion({ id: 'mc-1' }), buildMultipleQuestion({ id: 'mc-2' }), truefalse('tf-1')]) {
      await insertQuestionInSection(database, question, NOW);
    }
    expect(await getQuestionPlace(database, 'mc-2')).toEqual({ number: 2, indexInSection: 1, sectionSize: 2 });
    expect(await getQuestionPlace(database, 'tf-1')).toEqual({ number: 3, indexInSection: 0, sectionSize: 1 });
    expect(await getQuestionPlace(database, 'missing')).toBeNull();
  });
});

describe('the topic screen\'s reads', () => {
  async function openWithMix() {
    const database = await openWithTopic();
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1', question: 'What is 15% of 240?' }), NOW);
    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-2', question: 'Which is 100% sure?' }), NOW);
    await insertQuestionInSection(database, truefalse('tf-1', 'Every prime number is odd.'), NOW);
    await insertQuestionInSection(database, identification('id-1', 'Quotient', 'The result of division.'), NOW);
    return database;
  }

  it('pages in order with each question\'s number in the whole topic', async () => {
    const database = await openWithMix();
    const first = await listQuestionsPage(database, 'topic-1', { search: '', limit: 3, offset: 0 });
    expect(first.map((row) => [row.question.id, row.number])).toEqual([['mc-1', 1], ['mc-2', 2], ['tf-1', 3]]);
    const second = await listQuestionsPage(database, 'topic-1', { search: '', limit: 3, offset: 3 });
    expect(second.map((row) => [row.question.id, row.number])).toEqual([['id-1', 4]]);
    // The keys come with the rows.
    expect(first[0].question).toMatchObject({ type: 'multiple' });
  });

  it('searches wording and identification answers, keeping the numbers from the whole topic', async () => {
    const database = await openWithMix();
    const byWording = await listQuestionsPage(database, 'topic-1', { search: 'prime', limit: 10, offset: 0 });
    expect(byWording.map((row) => [row.question.id, row.number])).toEqual([['tf-1', 3]]);
    const byAnswer = await listQuestionsPage(database, 'topic-1', { search: 'quotient', limit: 10, offset: 0 });
    expect(byAnswer.map((row) => row.question.id)).toEqual(['id-1']);
  });

  it('takes % and _ in a search literally', async () => {
    const database = await openWithMix();
    expect((await listQuestionsPage(database, 'topic-1', { search: '15%', limit: 10, offset: 0 })).map((row) => row.question.id)).toEqual(['mc-1']);
    expect(await listQuestionsPage(database, 'topic-1', { search: '%', limit: 10, offset: 0 })).toHaveLength(2);
    expect(await listQuestionsPage(database, 'topic-1', { search: '_', limit: 10, offset: 0 })).toHaveLength(0);
    expect(buildLikePattern(' 5%_\\ ')).toBe('%5\\%\\_\\\\%');
  });

  it('counts each section, among the matches when searching', async () => {
    const database = await openWithMix();
    expect(await countQuestionsByType(database, 'topic-1')).toEqual({ multiple: 2, truefalse: 1, identification: 1, essay: 0 });
    expect(await countQuestionsByType(database, 'topic-1', '%')).toEqual({ multiple: 2, truefalse: 0, identification: 0, essay: 0 });
    expect(await listQuestionIdsByTopic(database, 'topic-1')).toHaveLength(4);
  });

  it('reads a 500-question topic a page at a time', async () => {
    const database = await openWithTopic();
    for (let n = 0; n < 500; n += 1) await insertQuestionInSection(database, { ...truefalse(`tf-${n}`, `Statement ${n}`), sortingOrder: 0 }, NOW);
    const page = await listQuestionsPage(database, 'topic-1', { search: '', limit: 60, offset: 440 });
    expect(page).toHaveLength(60);
    expect(page[0].number).toBe(441);
    expect(page[59].number).toBe(500);
  });
});

describe('exams made from a topic', () => {
  it('counts them, and a deleted topic leaves them and their scores', async () => {
    const database = await openWithTopic();
    expect(await countExamsByTopic(database, 'topic-1')).toBe(0);
    await insertExamWithFirstAttempt(database, buildExam(), buildAttempt(), buildAttemptQuestions());
    expect(await countExamsByTopic(database, 'topic-1')).toBe(1);

    await insertQuestionInSection(database, buildMultipleQuestion({ id: 'mc-1' }), NOW);
    expect(await deleteTopic(database, 'topic-1')).toBe(true);
    expect(await countQuestionsByType(database, 'topic-1')).toEqual({ multiple: 0, truefalse: 0, identification: 0, essay: 0 });
    // The exam stays, with no topic, and its copied questions are untouched.
    expect(await getExam(database, 'exam-1')).toMatchObject({ topicId: null, name: 'Cell biology quiz' });
    expect(await listAttemptQuestions(database, 'attempt-1')).toHaveLength(2);
  });
});
