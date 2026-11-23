import { describe, expect, it } from 'vitest';
import {
  countQuestionsByTopic,
  deleteQuestion,
  findNextSortingOrder,
  getQuestion,
  insertQuestion,
  listQuestionIdsByTopic,
  listQuestionsByIds,
  listQuestionsByTopic,
  updateQuestion,
} from '../repositories/questions';
import {
  countTopics,
  deleteTopic,
  getTopic,
  insertTopic,
  listSectionDirections,
  listTopicsPage,
  saveSectionDirection,
  updateTopicHeader,
} from '../repositories/topics';
import { buildMultipleQuestion, buildOneOfEachType, buildTopic } from '../testing/fixtures';
import { openMigratedMemoryDatabase } from '../testing/memoryDatabase';

async function openWithTopic() {
  const database = await openMigratedMemoryDatabase();
  await insertTopic(database, buildTopic());
  return database;
}

async function countRows(database: Awaited<ReturnType<typeof openWithTopic>>, table: string) {
  return (await database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`))?.total;
}

describe('topics', () => {
  it('saves and reads a topic, and edits its header', async () => {
    const database = await openWithTopic();
    expect(await getTopic(database, 'topic-1')).toEqual(buildTopic());

    const header = { title: 'Genetics', subjectLabel: null, generalDirections: '' };
    expect(await updateTopicHeader(database, 'topic-1', header, 5_000)).toBe(true);
    expect(await getTopic(database, 'topic-1')).toMatchObject({ ...header, updatedAt: 5_000 });
    expect(await updateTopicHeader(database, 'missing', header, 5_000)).toBe(false);
  });

  it('lists topics a page at a time, newest edit first, with question counts', async () => {
    const database = await openWithTopic();
    await insertTopic(database, buildTopic({ id: 'topic-2', title: 'Ecology', updatedAt: 3_000 }));
    await insertTopic(database, buildTopic({ id: 'topic-3', title: 'Anatomy', updatedAt: 2_000 }));
    for (const question of buildOneOfEachType('topic-3')) await insertQuestion(database, question, 2_000);

    const firstPage = await listTopicsPage(database, { limit: 2, offset: 0 });
    expect(firstPage.map((topic) => [topic.id, topic.questionCount])).toEqual([
      ['topic-2', 0],
      ['topic-3', 4],
    ]);
    const secondPage = await listTopicsPage(database, { limit: 2, offset: 2 });
    expect(secondPage.map((topic) => topic.id)).toEqual(['topic-1']);
    expect(await countTopics(database)).toBe(3);
  });

  it('keeps one direction per question type, replacing the earlier one', async () => {
    const database = await openWithTopic();
    await saveSectionDirection(database, 'd1', 'topic-1', { questionType: 'essay', mode: 'template', text: '' });
    await saveSectionDirection(database, 'd2', 'topic-1', { questionType: 'essay', mode: 'custom', text: 'Two paragraphs.' });
    expect(await listSectionDirections(database, 'topic-1')).toEqual([{ questionType: 'essay', mode: 'custom', text: 'Two paragraphs.' }]);
  });

  it('deletes a topic with its questions and keys', async () => {
    const database = await openWithTopic();
    for (const question of buildOneOfEachType()) await insertQuestion(database, question, 2_000);
    await saveSectionDirection(database, 'd1', 'topic-1', { questionType: 'multiple', mode: 'none', text: '' });

    expect(await deleteTopic(database, 'topic-1')).toBe(true);
    for (const table of [
      'topic_questions',
      'topic_question_answer_multiple',
      'topic_question_answer_true_false',
      'topic_question_answer_essay',
      'topic_section_directions',
    ]) {
      expect(await countRows(database, table), table).toBe(0);
    }
  });
});

describe('questions', () => {
  it('saves each question type with its key and reads it back whole', async () => {
    const database = await openWithTopic();
    const questions = buildOneOfEachType();
    for (const question of questions) await insertQuestion(database, question, 2_000);

    expect(await listQuestionsByTopic(database, 'topic-1', { limit: 10, offset: 0 })).toEqual(questions);
    expect(await getQuestion(database, 'q-essay')).toEqual(questions[3]);
    expect((await getTopic(database, 'topic-1'))?.updatedAt).toBe(2_000);
  });

  it('pages questions in their order', async () => {
    const database = await openWithTopic();
    for (const question of buildOneOfEachType()) await insertQuestion(database, question, 2_000);
    const page = await listQuestionsByTopic(database, 'topic-1', { limit: 2, offset: 2 });
    expect(page.map((question) => question.id)).toEqual(['q-identification', 'q-essay']);
    expect(await countQuestionsByTopic(database, 'topic-1')).toBe(4);
    expect(await findNextSortingOrder(database, 'topic-1')).toBe(4);
    expect(await findNextSortingOrder(database, 'empty-topic')).toBe(0);
  });

  it('reads a picked set by ids, and lists ids without reading questions', async () => {
    const database = await openWithTopic();
    for (const question of buildOneOfEachType()) await insertQuestion(database, question, 2_000);
    expect(await listQuestionIdsByTopic(database, 'topic-1')).toEqual(['q-multiple', 'q-truefalse', 'q-identification', 'q-essay']);
    const picked = await listQuestionsByIds(database, ['q-essay', 'q-multiple']);
    expect(picked.map((question) => question.id)).toEqual(['q-multiple', 'q-essay']);
    expect(await listQuestionsByIds(database, [])).toEqual([]);
  });

  it('replaces the key when a question changes type', async () => {
    const database = await openWithTopic();
    await insertQuestion(database, buildMultipleQuestion({ id: 'q1' }), 2_000);

    const asTrueFalse = { id: 'q1', topicId: 'topic-1', question: 'ATP is made in mitochondria.', point: 2, sortingOrder: 0, type: 'truefalse' as const, answerIsTrue: true };
    expect(await updateQuestion(database, asTrueFalse, 3_000)).toBe(true);
    expect(await getQuestion(database, 'q1')).toEqual(asTrueFalse);
    expect(await countRows(database, 'topic_question_answer_multiple')).toBe(0);
    expect(await updateQuestion(database, { ...asTrueFalse, id: 'missing' }, 3_000)).toBe(false);
  });

  it('deletes a question and puts it back the same for Undo', async () => {
    const database = await openWithTopic();
    const question = buildMultipleQuestion({ id: 'q1' });
    await insertQuestion(database, question, 2_000);

    const deleted = await deleteQuestion(database, 'q1', 3_000);
    expect(deleted).toEqual(question);
    expect(await countRows(database, 'topic_question_answer_multiple')).toBe(0);

    await insertQuestion(database, deleted!, 4_000);
    expect(await getQuestion(database, 'q1')).toEqual(question);
    expect(await deleteQuestion(database, 'missing', 5_000)).toBeNull();
  });

  it('rolls back a question whose key cannot be saved', async () => {
    const database = await openWithTopic();
    const question = buildMultipleQuestion({ id: 'q1' });
    await insertQuestion(database, question, 2_000);
    // Same choice ids again: the second insert's choices collide, so its question row must not stay.
    const duplicateChoices = buildMultipleQuestion({ id: 'q2', choices: (question as Extract<typeof question, { type: 'multiple' }>).choices });
    await expect(insertQuestion(database, duplicateChoices, 3_000)).rejects.toThrow();
    expect(await getQuestion(database, 'q2')).toBeNull();
  });

  it('refuses a question on a topic that does not exist', async () => {
    const database = await openWithTopic();
    await expect(insertQuestion(database, buildMultipleQuestion({ topicId: 'missing' }), 2_000)).rejects.toThrow(/FOREIGN KEY/);
  });
});
