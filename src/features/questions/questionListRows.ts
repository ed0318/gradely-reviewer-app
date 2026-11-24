import type { QuestionType, TopicQuestion } from '@/db/records';
import type { NumberedQuestion, QuestionCounts } from '@/db/repositories/questionList';

/** What the topic screen's list is made of: a header for each section, then that section's rows. */
export type QuestionListEntry =
  | { kind: 'header'; key: string; type: QuestionType; count: number }
  | { kind: 'row'; key: string; question: TopicQuestion; number: number };

/**
 * The loaded rows with a header before each section. The rows are a prefix of
 * the topic in section order, so a header goes wherever the type changes; its
 * count is the section's whole size, loaded or not.
 */
export function buildListEntries(rows: NumberedQuestion[], counts: QuestionCounts): QuestionListEntry[] {
  const entries: QuestionListEntry[] = [];
  let currentType: QuestionType | null = null;
  for (const row of rows) {
    if (row.question.type !== currentType) {
      currentType = row.question.type;
      entries.push({ kind: 'header', key: `header:${currentType}`, type: currentType, count: counts[currentType] });
    }
    entries.push({ kind: 'row', key: row.question.id, question: row.question, number: row.number });
  }
  return entries;
}

/** The rows without this question, the ones after it renumbered. For deleting in place, with no re-read. */
export function removeRowAndRenumber(rows: NumberedQuestion[], questionId: string): NumberedQuestion[] {
  const removed = rows.find((row) => row.question.id === questionId);
  if (!removed) return rows;
  return rows
    .filter((row) => row !== removed)
    .map((row) => (row.number > removed.number ? { ...row, number: row.number - 1 } : row));
}

/** The rows with a restored question back in its place, the ones from there on renumbered. For Undo. */
export function insertRowAndRenumber(rows: NumberedQuestion[], restored: NumberedQuestion): NumberedQuestion[] {
  const insertAt = rows.findIndex((row) => row.number >= restored.number);
  const shifted = rows.map((row) => (row.number >= restored.number ? { ...row, number: row.number + 1 } : row));
  if (insertAt < 0) return [...shifted, restored];
  return [...shifted.slice(0, insertAt), restored, ...shifted.slice(insertAt)];
}

export const addToCount = (counts: QuestionCounts, type: QuestionType, change: number): QuestionCounts => ({ ...counts, [type]: Math.max(0, counts[type] + change) });

export const sumCounts = (counts: QuestionCounts): number => counts.multiple + counts.truefalse + counts.identification + counts.essay;
