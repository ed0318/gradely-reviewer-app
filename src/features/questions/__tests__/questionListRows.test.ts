import { describe, expect, it } from 'vitest';
import type { NumberedQuestion } from '@/db/repositories/questionList';
import { buildOneOfEachType } from '@/db/testing/fixtures';
import { addToCount, buildListEntries, insertRowAndRenumber, removeRowAndRenumber, sumCounts } from '../questionListRows';

const rows: NumberedQuestion[] = buildOneOfEachType().map((question, index) => ({ question, number: index + 1 }));
const counts = { multiple: 52, truefalse: 14, identification: 12, essay: 6 };

describe('question list rows', () => {
  it('puts a header with the whole count before each section', () => {
    const entries = buildListEntries(rows, counts);
    expect(entries.map((entry) => (entry.kind === 'header' ? `${entry.type}:${entry.count}` : entry.key))).toEqual([
      'multiple:52',
      'q-multiple',
      'truefalse:14',
      'q-truefalse',
      'identification:12',
      'q-identification',
      'essay:6',
      'q-essay',
    ]);
  });

  it('shows only the sections that have loaded rows, so an unfinished page ends mid-section', () => {
    expect(buildListEntries(rows.slice(0, 2), counts).filter((entry) => entry.kind === 'header')).toHaveLength(2);
    expect(buildListEntries([], counts)).toEqual([]);
  });

  it('removes a row and renumbers the ones after it', () => {
    const next = removeRowAndRenumber(rows, 'q-truefalse');
    expect(next.map((row) => [row.question.id, row.number])).toEqual([
      ['q-multiple', 1],
      ['q-identification', 2],
      ['q-essay', 3],
    ]);
    expect(removeRowAndRenumber(rows, 'missing')).toBe(rows);
  });

  it('puts a restored row back in its place and renumbers the ones after it', () => {
    const removed = rows[1];
    const without = removeRowAndRenumber(rows, removed.question.id);
    expect(insertRowAndRenumber(without, removed)).toEqual(rows);
    expect(insertRowAndRenumber([], removed)).toEqual([removed]);
    // Restoring the last one appends it.
    const last = rows[3];
    expect(insertRowAndRenumber(removeRowAndRenumber(rows, last.question.id), last)).toEqual(rows);
  });

  it('adjusts and sums the counts', () => {
    expect(sumCounts(counts)).toBe(84);
    expect(addToCount(counts, 'essay', -1).essay).toBe(5);
    expect(addToCount({ ...counts, essay: 0 }, 'essay', -1).essay).toBe(0);
  });
});
