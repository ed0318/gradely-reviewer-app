import { describe, expect, it } from 'vitest';
import { calculatePercent, describeScoreChange, formatClock, formatDuration, formatPoints, isBestSoFar } from '../formatExam';

describe('exam words and numbers', () => {
  it('formats the clock and the time taken', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(754)).toBe('12:34');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(720)).toBe('12 min');
    expect(formatDuration(754)).toBe('12 min 34 s');
  });

  it('works out the percent, and 0 for nothing to score', () => {
    expect(calculatePercent(26, 30)).toBe(87);
    expect(calculatePercent(0, 0)).toBe(0);
    expect(formatPoints(7.5)).toBe('7.5');
    expect(formatPoints(26)).toBe('26');
  });

  it('describes the change from last time', () => {
    expect(describeScoreChange(null, { score: 26, totalPoints: 30 })).toBeNull();
    expect(describeScoreChange({ score: 24, totalPoints: 30 }, { score: 26, totalPoints: 30 })).toBe('+2 from last time');
    expect(describeScoreChange({ score: 26, totalPoints: 30 }, { score: 24, totalPoints: 30 })).toBe('−2 from last time');
    expect(describeScoreChange({ score: 26, totalPoints: 30 }, { score: 26, totalPoints: 30 })).toBe('same as last time');
    // The missed-only retake has fewer points, so shares are compared.
    expect(describeScoreChange({ score: 20, totalPoints: 30 }, { score: 4, totalPoints: 4 })).toBe('+33% from last time');
  });

  it('knows a best score, and needs another attempt to mean anything', () => {
    expect(isBestSoFar(null, { score: 30, totalPoints: 30 })).toBe(false);
    expect(isBestSoFar({ score: 24, totalPoints: 30 }, { score: 26, totalPoints: 30 })).toBe(true);
    expect(isBestSoFar({ score: 27, totalPoints: 30 }, { score: 26, totalPoints: 30 })).toBe(false);
    expect(isBestSoFar({ score: 9, totalPoints: 10 }, { score: 27, totalPoints: 30 })).toBe(true);
  });
});
