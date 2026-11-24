import { describe, expect, it } from 'vitest';
import type { ProgressExam } from '@/db/repositories/progress';
import { CHART_HEIGHT, describeChart, layoutChartBars } from '../chartBars';
import { describeExamCount, filterProgressExams } from '../filterProgressExams';
import { ATTEMPTS_PAGE_SIZE, describePaging } from '../paging';
import { describeAttemptCount, formatAttemptDate, formatAttemptScore, formatAttemptTime, formatPercentOrDash, toPercent } from '../progressFormat';

const exam = (name: string, topicTitle: string | null): ProgressExam => ({ examId: name, name, topicTitle, tries: 1, bestFraction: 0.5 });
const EXAMS = [
  exam('Numerical drill', 'Civil Service — Numerical'),
  exam('LET Gen Ed — English mock', 'LET Gen Ed — English'),
  exam('LET Gen Ed — Reading', 'LET Gen Ed — English'),
  exam('Pharmacology quick check', 'Pharmacology'),
  exam('Algebra speed round', 'Civil Service — Numerical'),
  exam('Orphaned exam', null),
];

describe('paging', () => {
  it('describes 23 attempts as three pages of ten', () => {
    expect(ATTEMPTS_PAGE_SIZE).toBe(10);
    expect(describePaging(23, 0)).toEqual({ pageIndex: 0, pageCount: 3, offset: 0, hasPrevious: false, hasNext: true, rangeText: '1–10 of 23' });
    expect(describePaging(23, 1)).toMatchObject({ pageIndex: 1, offset: 10, hasPrevious: true, hasNext: true, rangeText: '11–20 of 23' });
    expect(describePaging(23, 2)).toMatchObject({ pageIndex: 2, offset: 20, hasPrevious: true, hasNext: false, rangeText: '21–23 of 23' });
  });

  it('is one page for ten or fewer, and for none', () => {
    expect(describePaging(10, 0)).toMatchObject({ pageCount: 1, hasNext: false, rangeText: '1–10 of 10' });
    expect(describePaging(1, 0)).toMatchObject({ pageCount: 1, rangeText: '1–1 of 1' });
    expect(describePaging(0, 0)).toMatchObject({ pageCount: 1, hasPrevious: false, hasNext: false, rangeText: '0 of 0' });
  });

  it('pulls a page past the end back to the last one, and a negative one to the first', () => {
    expect(describePaging(23, 9).pageIndex).toBe(2);
    expect(describePaging(23, -1).pageIndex).toBe(0);
  });
});

describe('picker search', () => {
  it('keeps everything for an empty or blank search', () => {
    expect(filterProgressExams(EXAMS, '')).toHaveLength(6);
    expect(filterProgressExams(EXAMS, '   ')).toHaveLength(6);
  });

  it('matches the exam name or the topic name, ignoring case', () => {
    expect(filterProgressExams(EXAMS, 'let').map((match) => match.name)).toEqual(['LET Gen Ed — English mock', 'LET Gen Ed — Reading']);
    expect(filterProgressExams(EXAMS, 'civil').map((match) => match.name)).toEqual(['Numerical drill', 'Algebra speed round']);
    expect(filterProgressExams(EXAMS, ' PHARMA ').map((match) => match.name)).toEqual(['Pharmacology quick check']);
  });

  it('finds nothing for a word no exam or topic has, and copes with a deleted topic', () => {
    expect(filterProgressExams(EXAMS, 'zzz')).toEqual([]);
    expect(filterProgressExams(EXAMS, 'orphan').map((match) => match.name)).toEqual(['Orphaned exam']);
    expect(filterProgressExams(EXAMS, 'null')).toEqual([]);
  });

  it('counts "6 exams", then "2 of 6 exams" while searching', () => {
    expect(describeExamCount(6, 6, '')).toBe('6 exams');
    expect(describeExamCount(2, 6, 'let')).toBe('2 of 6 exams');
    expect(describeExamCount(0, 6, 'zzz')).toBe('0 of 6 exams');
    expect(describeExamCount(1, 1, '')).toBe('1 exam');
  });
});

describe('chart', () => {
  it('lays six bars out oldest to newest, 44 wide with 12 between, the last one the latest', () => {
    const bars = layoutChartBars(Array.from({ length: 6 }, (_, index) => ({ attemptNumber: index + 18, percent: 50 + index * 10 })), 330);
    expect(bars.map((bar) => bar.attemptNumber)).toEqual([18, 19, 20, 21, 22, 23]);
    expect(bars.map((bar) => bar.isLatest)).toEqual([false, false, false, false, false, true]);
    expect(bars[0]).toMatchObject({ x: 0, width: 44, height: 40 });
    expect(bars[5].height).toBe(80);
    expect(bars[1].x).toBeGreaterThan(bars[0].x + bars[0].width);
  });

  it('never stretches one bar across the chart, and keeps a bar inside its height', () => {
    const [only] = layoutChartBars([{ attemptNumber: 1, percent: 100 }], 330);
    expect(only.width).toBe(44);
    expect(only.height).toBeLessThanOrEqual(CHART_HEIGHT);
    expect(layoutChartBars([{ attemptNumber: 1, percent: 140 }], 330)[0].height).toBe(80);
    expect(layoutChartBars([], 330)).toEqual([]);
    expect(layoutChartBars([{ attemptNumber: 1, percent: 50 }], 0)).toEqual([]);
  });

  it('describes itself for a screen reader', () => {
    expect(describeChart([{ attemptNumber: 1, percent: 80 }, { attemptNumber: 2, percent: 90 }])).toBe('Scores for the last 2 attempts: 80, 90 percent');
    expect(describeChart([{ attemptNumber: 1, percent: 80 }])).toBe('Scores for the last 1 attempt: 80 percent');
  });
});

describe('progress words', () => {
  it('rounds a share to a percent and dashes a missing one', () => {
    expect(toPercent(0.8667)).toBe(87);
    expect(toPercent(null)).toBeNull();
    expect(formatPercentOrDash(0.5)).toBe('50%');
    expect(formatPercentOrDash(null)).toBe('–');
  });

  it('shows the date without a year this year, with it otherwise', () => {
    const now = new Date(2026, 10, 24, 12).getTime();
    expect(formatAttemptDate(new Date(2026, 10, 22, 20).getTime(), now)).toBe('Nov 22');
    expect(formatAttemptDate(new Date(2025, 11, 5, 8).getTime(), now)).toBe('Dec 5, 2025');
  });

  it('formats score, time and counts', () => {
    expect(formatAttemptScore(24, 30)).toBe('24/30');
    expect(formatAttemptScore(7.5, 10)).toBe('7.5/10');
    expect(formatAttemptTime(754)).toBe('12:34');
    expect(describeAttemptCount(1)).toBe('1 attempt');
    expect(describeAttemptCount(23)).toBe('23 attempts');
  });
});
