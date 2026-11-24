import type { SQLiteDatabase } from 'expo-sqlite';
import { QUESTION_TYPES, type QuestionType, type TopicQuestion } from '../records';
import { attachAnswers, type QuestionRow } from './questions';

/** What the topic screen reads: a page of questions with their numbers, and the count in each section. */

export type NumberedQuestion = { question: TopicQuestion; number: number };

export type QuestionListRequest = { search: string; limit: number; offset: number };

export type QuestionCounts = Record<QuestionType, number>;

/** A LIKE pattern for "contains this text", with the characters LIKE treats as wildcards taken literally. */
export function buildLikePattern(search: string): string {
  return `%${search.trim().replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

/** Matches the question's wording or an identification answer. Binds the pattern twice. */
const SEARCH_CLAUSE = "AND (q.question LIKE ? ESCAPE '\\' OR q.answer LIKE ? ESCAPE '\\')";

const searchBindings = (search: string): string[] => {
  if (search.trim() === '') return [];
  const pattern = buildLikePattern(search);
  return [pattern, pattern];
};

const searchClause = (search: string) => (search.trim() === '' ? '' : SEARCH_CLAUSE);

/**
 * One page of a topic's questions in their order, with keys, each with its
 * number in the whole topic (not among the matches, so the editor's "Question 7"
 * agrees with the list). An empty `search` lists them all.
 */
export async function listQuestionsPage(database: SQLiteDatabase, topicId: string, request: QuestionListRequest): Promise<NumberedQuestion[]> {
  const rows = await database.getAllAsync<QuestionRow & { place: number }>(
    `SELECT q.*,
            (SELECT COUNT(*) FROM topic_questions p WHERE p.topic_id = q.topic_id AND p.sorting_order < q.sorting_order) + 1 AS place
       FROM topic_questions q
      WHERE q.topic_id = ? ${searchClause(request.search)}
      ORDER BY q.sorting_order, q.id
      LIMIT ? OFFSET ?`,
    topicId,
    ...searchBindings(request.search),
    request.limit,
    request.offset,
  );
  const questions = await attachAnswers(database, rows);
  return questions.map((question, index) => ({ question, number: rows[index].place }));
}

/** How many questions each section holds, among those matching `search` (empty: all of them). */
export async function countQuestionsByType(database: SQLiteDatabase, topicId: string, search = ''): Promise<QuestionCounts> {
  const rows = await database.getAllAsync<{ type: QuestionType; total: number }>(
    `SELECT q.type, COUNT(*) AS total FROM topic_questions q WHERE q.topic_id = ? ${searchClause(search)} GROUP BY q.type`,
    topicId,
    ...searchBindings(search),
  );
  const counts = Object.fromEntries(QUESTION_TYPES.map((type) => [type, 0])) as QuestionCounts;
  for (const row of rows) counts[row.type] = row.total;
  return counts;
}
