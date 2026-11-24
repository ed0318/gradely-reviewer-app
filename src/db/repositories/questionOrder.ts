import type { SQLiteDatabase } from 'expo-sqlite';
import { QUESTION_TYPES, type QuestionType } from '../records';
import { buildPlaceholders } from './sqlPlaceholders';
import { touchTopic } from './topics';

/**
 * Where a topic's questions sit. `sorting_order` runs through the whole topic in
 * section order (Multiple choice, True or false, Identification, Essay), as
 * gradely-app keeps an exam's list, so a question's number is its place in that
 * order. Gaps are fine (a deleted question leaves one); two questions never
 * share a number, because every insert makes room first.
 */

/** The section a type belongs to, and every section before it. */
const typesThrough = (type: QuestionType): QuestionType[] => QUESTION_TYPES.slice(0, QUESTION_TYPES.indexOf(type) + 1);

/**
 * Where a new question of this type goes: after the last question of its own
 * section, or after the sections before it when its own is empty.
 * `exceptQuestionId` leaves one question out, for the one being retyped.
 */
export async function findSectionEndOrder(database: SQLiteDatabase, topicId: string, type: QuestionType, exceptQuestionId = ''): Promise<number> {
  const types = typesThrough(type);
  const row = await database.getFirstAsync<{ last_order: number | null }>(
    `SELECT MAX(sorting_order) AS last_order FROM topic_questions
      WHERE topic_id = ? AND id <> ? AND type IN (${buildPlaceholders(types.length)})`,
    topicId,
    exceptQuestionId,
    ...types,
  );
  return row?.last_order == null ? 0 : row.last_order + 1;
}

/** Moves every question at this place or later one step down the list, making room. Run inside a transaction. */
export async function makeRoomAt(database: SQLiteDatabase, topicId: string, position: number): Promise<void> {
  await database.runAsync('UPDATE topic_questions SET sorting_order = sorting_order + 1 WHERE topic_id = ? AND sorting_order >= ?', topicId, position);
}

/** Moves a question one place within its section, swapping with its neighbour. False at the edge of the section. */
export async function moveQuestionWithinSection(database: SQLiteDatabase, questionId: string, direction: -1 | 1, now: number): Promise<boolean> {
  let isMoved = false;
  await database.withTransactionAsync(async () => {
    const current = await database.getFirstAsync<{ topic_id: string; type: QuestionType; sorting_order: number }>(
      'SELECT topic_id, type, sorting_order FROM topic_questions WHERE id = ?',
      questionId,
    );
    if (!current) return;
    const neighbour = await database.getFirstAsync<{ id: string; sorting_order: number }>(
      direction === -1
        ? 'SELECT id, sorting_order FROM topic_questions WHERE topic_id = ? AND type = ? AND sorting_order < ? ORDER BY sorting_order DESC LIMIT 1'
        : 'SELECT id, sorting_order FROM topic_questions WHERE topic_id = ? AND type = ? AND sorting_order > ? ORDER BY sorting_order ASC LIMIT 1',
      current.topic_id,
      current.type,
      current.sorting_order,
    );
    if (!neighbour) return;
    await database.runAsync('UPDATE topic_questions SET sorting_order = ? WHERE id = ?', neighbour.sorting_order, questionId);
    await database.runAsync('UPDATE topic_questions SET sorting_order = ? WHERE id = ?', current.sorting_order, neighbour.id);
    await touchTopic(database, current.topic_id, now);
    isMoved = true;
  });
  return isMoved;
}

/** Where a question is: its number in the topic, and its place in its section (0-based, with the section's size). */
export type QuestionPlace = { number: number; indexInSection: number; sectionSize: number };

export async function getQuestionPlace(database: SQLiteDatabase, questionId: string): Promise<QuestionPlace | null> {
  const row = await database.getFirstAsync<{ before_count: number; before_in_section: number; section_size: number }>(
    `SELECT (SELECT COUNT(*) FROM topic_questions p WHERE p.topic_id = q.topic_id AND p.sorting_order < q.sorting_order) AS before_count,
            (SELECT COUNT(*) FROM topic_questions p WHERE p.topic_id = q.topic_id AND p.type = q.type AND p.sorting_order < q.sorting_order) AS before_in_section,
            (SELECT COUNT(*) FROM topic_questions p WHERE p.topic_id = q.topic_id AND p.type = q.type) AS section_size
       FROM topic_questions q WHERE q.id = ?`,
    questionId,
  );
  return row ? { number: row.before_count + 1, indexInSection: row.before_in_section, sectionSize: row.section_size } : null;
}
