import { describe, expect, it } from 'vitest';
import type { CreditTransaction } from '@/api/credits';
import { buildHistoryRow, describeHistoryCount, describeServerPaging, formatHistoryWhen } from '../historyRows';

const MANILA = 'Asia/Manila';
const NOW = new Date('2026-11-23T14:00:00Z'); // 22:00 on Nov 23 in Manila

const chargeRow: CreditTransaction = { id: 21, type: 'exam_charge', units: -30, balanceAfterUnits: 568, examName: 'Numerical drill #5', itemCount: 30, createdAt: '2026-11-23T20:06:00+08:00' };

describe('credit history rows', () => {
  it('draws an exam charge as "Exam name · 30 items", today, with a minus', () => {
    expect(buildHistoryRow(chargeRow, NOW, MANILA)).toMatchObject({ title: 'Numerical drill #5 · 30 items', when: 'Today · 20:06', amount: '−7.5', isGain: false });
  });

  it('draws a purchase as "Bought 280 credits" in green with a plus', () => {
    const row = buildHistoryRow({ id: 9, type: 'purchase', units: 1_120, balanceAfterUnits: 950, examName: null, itemCount: null, createdAt: '2026-11-08T16:45:00+08:00' }, NOW, MANILA);
    expect(row).toMatchObject({ title: 'Bought 280 credits', when: 'Nov 8 · 16:45', amount: '+280', isGain: true });
    expect(row.spokenLabel).toBe('Bought 280 credits, Nov 8 · 16:45, plus 280 credits');
  });

  it('draws quarter credits exactly, and a single item in the singular', () => {
    expect(buildHistoryRow({ ...chargeRow, units: -1, itemCount: 1 }, NOW, MANILA)).toMatchObject({ title: 'Numerical drill #5 · 1 item', amount: '−0.25' });
  });

  it('names adjustments and refunds, signed by their units', () => {
    expect(buildHistoryRow({ ...chargeRow, type: 'adjustment', units: 8, examName: null, itemCount: null }, NOW, MANILA)).toMatchObject({ title: 'Credit adjustment', amount: '+2', isGain: true });
    expect(buildHistoryRow({ ...chargeRow, type: 'refund', units: 30, examName: null, itemCount: null }, NOW, MANILA)).toMatchObject({ title: 'Refund · 7.5 credits', amount: '+7.5' });
  });

  it('shows the year only for another year, and nothing for a missing time', () => {
    expect(formatHistoryWhen('2025-12-31T23:30:00Z', NOW, MANILA)).toBe('Jan 1 · 07:30');
    expect(formatHistoryWhen('2025-06-01T00:00:00Z', NOW, MANILA)).toBe('Jun 1, 2025 · 08:00');
    expect(formatHistoryWhen(null, NOW, MANILA)).toBe('');
  });
});

describe('history paging and counts', () => {
  it('reads the page from the server: "Page 2 of 3 · 11–20 of 21"', () => {
    expect(describeServerPaging({ total: 21, perPage: 10, currentPage: 2, lastPage: 3, from: 11, to: 20 })).toEqual({
      pageIndex: 1,
      pageCount: 3,
      offset: 10,
      hasPrevious: true,
      hasNext: true,
      rangeText: '11–20 of 21',
    });
  });

  it('has no Prev on the first page and no Next on the last', () => {
    expect(describeServerPaging({ total: 21, perPage: 10, currentPage: 1, lastPage: 3, from: 1, to: 10 })).toMatchObject({ hasPrevious: false, hasNext: true });
    expect(describeServerPaging({ total: 21, perPage: 10, currentPage: 3, lastPage: 3, from: 21, to: 21 })).toMatchObject({ hasPrevious: true, hasNext: false, rangeText: '21–21 of 21' });
  });

  it('is "0 of 0" on one page when nothing matches or nothing has loaded', () => {
    expect(describeServerPaging({ total: 0, perPage: 10, currentPage: 1, lastPage: 1, from: null, to: null })).toMatchObject({ pageCount: 1, rangeText: '0 of 0', hasNext: false });
    expect(describeServerPaging(null).rangeText).toBe('0 of 0');
  });

  it('counts entries, or matches while filtered', () => {
    expect(describeHistoryCount(21, false)).toBe('21 entries');
    expect(describeHistoryCount(1, false)).toBe('1 entry');
    expect(describeHistoryCount(4, true)).toBe('4 found');
  });
});
