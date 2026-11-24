import type { SQLiteDatabase } from 'expo-sqlite';
import type { PageRequest, QuestionChoice, QuestionType, TopicQuestion } from '../records';
import { findSectionEndOrder, makeRoomAt } from './questionOrder';
import { buildPlaceholders, toSqlBoolean } from './sqlPlaceholders';
import { touchTopic } from './topics';

/**
 * A topic's questions and their keys, stored as gradely-app stores an exam's:
 * choices one row each with `is_correct`, true or false as `answer_is_true`,
 * identification in `topic_questions.answer`, and an essay's guide and lines in
 * their own row. Every write touches the topic's `updated_at`.
 */

export type QuestionRow = { id: string; topic_id: string; question: string; answer: string | null; type: QuestionType; point: number; sorting_order: number };
type ChoiceRow = { id: string; topic_question_id: string; choice_text: string; is_correct: number };
type TrueFalseRow = { topic_question_id: string; answer_is_true: number };
type EssayRow = { topic_question_id: string; answer_guide: string | null; no_lines: number };

/** The true/false and essay key rows are one per question, so their ids come from the question's. */
const trueFalseRowId = (questionId: string) => `${questionId}:truefalse`;
const essayRowId = (questionId: string) => `${questionId}:essay`;

async function insertAnswerRows(database: SQLiteDatabase, question: TopicQuestion): Promise<void> {
  switch (question.type) {
    case 'multiple':
      for (const [sortOrder, choice] of question.choices.entries()) {
        await database.runAsync(
          'INSERT INTO topic_question_answer_multiple (id, topic_question_id, choice_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)',
          choice.id,
          question.id,
          choice.choiceText,
          toSqlBoolean(choice.isCorrect),
          sortOrder,
        );
      }
      return;
    case 'truefalse':
      await database.runAsync(
        'INSERT INTO topic_question_answer_true_false (id, topic_question_id, answer_is_true) VALUES (?, ?, ?)',
        trueFalseRowId(question.id),
        question.id,
        toSqlBoolean(question.answerIsTrue),
      );
      return;
    case 'essay':
      await database.runAsync(
        'INSERT INTO topic_question_answer_essay (id, topic_question_id, answer_guide, no_lines) VALUES (?, ?, ?, ?)',
        essayRowId(question.id),
        question.id,
        question.answerGuide,
        question.lines,
      );
      return;
    case 'identification':
      return;
  }
}

async function deleteAnswerRows(database: SQLiteDatabase, questionId: string): Promise<void> {
  await database.runAsync('DELETE FROM topic_question_answer_multiple WHERE topic_question_id = ?', questionId);
  await database.runAsync('DELETE FROM topic_question_answer_true_false WHERE topic_question_id = ?', questionId);
  await database.runAsync('DELETE FROM topic_question_answer_essay WHERE topic_question_id = ?', questionId);
}

const identificationAnswer = (question: TopicQuestion) => (question.type === 'identification' ? question.answer : null);

/** The writes behind an insert, for a caller that already holds the transaction. */
async function insertQuestionRows(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<void> {
  await database.runAsync(
    'INSERT INTO topic_questions (id, topic_id, question, answer, type, point, sorting_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    question.id,
    question.topicId,
    question.question,
    identificationAnswer(question),
    question.type,
    question.point,
    question.sortingOrder,
  );
  await insertAnswerRows(database, question);
  await touchTopic(database, question.topicId, now);
}

/** The writes behind an update, for a caller that already holds the transaction. */
async function updateQuestionRows(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<boolean> {
  const result = await database.runAsync(
    'UPDATE topic_questions SET question = ?, answer = ?, type = ?, point = ?, sorting_order = ? WHERE id = ? AND topic_id = ?',
    question.question,
    identificationAnswer(question),
    question.type,
    question.point,
    question.sortingOrder,
    question.id,
    question.topicId,
  );
  if (result.changes === 0) return false;
  await deleteAnswerRows(database, question.id);
  await insertAnswerRows(database, question);
  await touchTopic(database, question.topicId, now);
  return true;
}

/** Adds a question at the `sortingOrder` it carries. Seeding and tests; the app adds with `insertQuestionInSection`. */
export async function insertQuestion(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<void> {
  await database.withTransactionAsync(() => insertQuestionRows(database, question, now));
}

/** Adds a question at the end of its own section, so the topic stays in section order. Returns it with its place. */
export async function insertQuestionInSection(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<TopicQuestion> {
  let placed: TopicQuestion = question;
  await database.withTransactionAsync(async () => {
    const position = await findSectionEndOrder(database, question.topicId, question.type);
    await makeRoomAt(database, question.topicId, position);
    placed = { ...question, sortingOrder: position };
    await insertQuestionRows(database, placed, now);
  });
  return placed;
}

/** Puts a deleted question back for Undo: same ids, in the place it had, with the others moved down to make room. */
export async function restoreQuestion(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<void> {
  await database.withTransactionAsync(async () => {
    await makeRoomAt(database, question.topicId, question.sortingOrder);
    await insertQuestionRows(database, question, now);
  });
}

/** Saves a question and replaces its key, including a change of type. False when it is gone. */
export async function updateQuestion(database: SQLiteDatabase, question: TopicQuestion, now: number): Promise<boolean> {
  let isUpdated = false;
  await database.withTransactionAsync(async () => {
    isUpdated = await updateQuestionRows(database, question, now);
  });
  return isUpdated;
}

/**
 * Saves what the editor holds. The place is the database's to say, not the
 * editor's (a Move may have happened since it was read): it stays where it is
 * unless the type changed, and then the question goes to the end of its new
 * section. Returns the question as saved, or null when it is gone.
 */
export async function saveEditedQuestion(database: SQLiteDatabase, edited: TopicQuestion, now: number): Promise<TopicQuestion | null> {
  let saved: TopicQuestion | null = null;
  await database.withTransactionAsync(async () => {
    const current = await database.getFirstAsync<{ type: QuestionType; sorting_order: number }>(
      'SELECT type, sorting_order FROM topic_questions WHERE id = ? AND topic_id = ?',
      edited.id,
      edited.topicId,
    );
    if (!current) return;
    let sortingOrder = current.sorting_order;
    if (current.type !== edited.type) {
      sortingOrder = await findSectionEndOrder(database, edited.topicId, edited.type, edited.id);
      await makeRoomAt(database, edited.topicId, sortingOrder);
    }
    const next: TopicQuestion = { ...edited, sortingOrder };
    if (await updateQuestionRows(database, next, now)) saved = next;
  });
  return saved;
}

/** Deletes a question and returns it whole, so Undo can put it back with `insertQuestion`. */
export async function deleteQuestion(database: SQLiteDatabase, questionId: string, now: number): Promise<TopicQuestion | null> {
  let deleted: TopicQuestion | null = null;
  await database.withTransactionAsync(async () => {
    deleted = await getQuestion(database, questionId);
    if (!deleted) return;
    await database.runAsync('DELETE FROM topic_questions WHERE id = ?', questionId);
    await touchTopic(database, deleted.topicId, now);
  });
  return deleted;
}

export async function getQuestion(database: SQLiteDatabase, questionId: string): Promise<TopicQuestion | null> {
  const [question] = await listQuestionsByIds(database, [questionId]);
  return question ?? null;
}

/** One page of a topic's questions in their order, with keys. */
export async function listQuestionsByTopic(database: SQLiteDatabase, topicId: string, page: PageRequest): Promise<TopicQuestion[]> {
  const rows = await database.getAllAsync<QuestionRow>(
    'SELECT * FROM topic_questions WHERE topic_id = ? ORDER BY sorting_order, id LIMIT ? OFFSET ?',
    topicId,
    page.limit,
    page.offset,
  );
  return attachAnswers(database, rows);
}

/** The questions with these ids, with keys, in topic order. For building an exam from a picked set. */
export async function listQuestionsByIds(database: SQLiteDatabase, questionIds: string[]): Promise<TopicQuestion[]> {
  if (questionIds.length === 0) return [];
  const rows = await database.getAllAsync<QuestionRow>(
    `SELECT * FROM topic_questions WHERE id IN (${buildPlaceholders(questionIds.length)}) ORDER BY sorting_order, id`,
    ...questionIds,
  );
  return attachAnswers(database, rows);
}

/** Every question id on a topic: enough to pick an exam's items without reading the questions. */
export async function listQuestionIdsByTopic(database: SQLiteDatabase, topicId: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ id: string }>('SELECT id FROM topic_questions WHERE topic_id = ? ORDER BY sorting_order, id', topicId);
  return rows.map((row) => row.id);
}

export async function countQuestionsByTopic(database: SQLiteDatabase, topicId: string): Promise<number> {
  const row = await database.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM topic_questions WHERE topic_id = ?', topicId);
  return row?.total ?? 0;
}

/** Where a new question goes: after the last one. */
export async function findNextSortingOrder(database: SQLiteDatabase, topicId: string): Promise<number> {
  const row = await database.getFirstAsync<{ next_order: number }>(
    'SELECT IFNULL(MAX(sorting_order) + 1, 0) AS next_order FROM topic_questions WHERE topic_id = ?',
    topicId,
  );
  return row?.next_order ?? 0;
}

/** Reads the keys for these question rows and joins them on, keeping the rows' order. */
export async function attachAnswers(database: SQLiteDatabase, rows: QuestionRow[]): Promise<TopicQuestion[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const placeholders = buildPlaceholders(ids.length);
  const [choiceRows, trueFalseRows, essayRows] = await Promise.all([
    database.getAllAsync<ChoiceRow>(
      `SELECT id, topic_question_id, choice_text, is_correct FROM topic_question_answer_multiple
        WHERE topic_question_id IN (${placeholders}) ORDER BY topic_question_id, sort_order`,
      ...ids,
    ),
    database.getAllAsync<TrueFalseRow>(
      `SELECT topic_question_id, answer_is_true FROM topic_question_answer_true_false WHERE topic_question_id IN (${placeholders})`,
      ...ids,
    ),
    database.getAllAsync<EssayRow>(
      `SELECT topic_question_id, answer_guide, no_lines FROM topic_question_answer_essay WHERE topic_question_id IN (${placeholders})`,
      ...ids,
    ),
  ]);

  const choicesByQuestion = new Map<string, QuestionChoice[]>();
  for (const choice of choiceRows) {
    const choices = choicesByQuestion.get(choice.topic_question_id) ?? [];
    choices.push({ id: choice.id, choiceText: choice.choice_text, isCorrect: choice.is_correct === 1 });
    choicesByQuestion.set(choice.topic_question_id, choices);
  }
  const trueFalseByQuestion = new Map(trueFalseRows.map((row) => [row.topic_question_id, row.answer_is_true === 1]));
  const essayByQuestion = new Map(essayRows.map((row) => [row.topic_question_id, row]));

  return rows.map((row): TopicQuestion => {
    const base = { id: row.id, topicId: row.topic_id, question: row.question, point: row.point, sortingOrder: row.sorting_order };
    switch (row.type) {
      case 'multiple':
        return { ...base, type: 'multiple', choices: choicesByQuestion.get(row.id) ?? [] };
      case 'truefalse':
        return { ...base, type: 'truefalse', answerIsTrue: trueFalseByQuestion.get(row.id) ?? false };
      case 'identification':
        return { ...base, type: 'identification', answer: row.answer ?? '' };
      case 'essay': {
        const essay = essayByQuestion.get(row.id);
        return { ...base, type: 'essay', answerGuide: essay?.answer_guide ?? null, lines: essay?.no_lines ?? 0 };
      }
    }
  });
}
