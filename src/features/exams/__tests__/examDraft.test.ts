import { describe, expect, it } from 'vitest';
import { calculateExamCostUnits, formatCredits } from '@/lib/creditUnits';
import {
  balanceAfterUnits,
  clampItemCount,
  cleanItemCountText,
  costOfTypedCount,
  countAffordableItems,
  describeItemCount,
  parseItemCountText,
  suggestExamName,
} from '../examDraft';
import { buildDefaultSchedule, composeScheduledAt, computeReminderAt, isScheduleInPast, parseRemindMinutes } from '../scheduleTimes';

describe('the cost of an exam', () => {
  it('is one unit an item, so 30 items cost 30 units (7.5 credits)', () => {
    expect(calculateExamCostUnits(30)).toBe(30);
    expect(formatCredits(calculateExamCostUnits(30))).toBe('7.5');
    expect(formatCredits(calculateExamCostUnits(1))).toBe('0.25');
    expect(formatCredits(calculateExamCostUnits(100))).toBe('25');
  });

  it('shows the balance after as units, never a float', () => {
    expect(balanceAfterUnits(568, 30)).toBe(538);
    expect(formatCredits(538)).toBe('134.5');
    expect(balanceAfterUnits(null, 30)).toBeNull();
  });

  it('prices a typed count as the nearest valid one, so the strip never blanks', () => {
    expect(costOfTypedCount(null, 84)).toBe(1);
    expect(costOfTypedCount(500, 84)).toBe(84);
    expect(costOfTypedCount(500, 500)).toBe(100);
    expect(costOfTypedCount(12, 84)).toBe(12);
  });

  it('counts the items a balance pays for', () => {
    expect(countAffordableItems(16)).toBe(16);
    expect(countAffordableItems(0)).toBe(0);
  });
});

describe('the item count', () => {
  it('takes digits only, three at most', () => {
    expect(cleanItemCountText('1a2b3c4')).toBe('123');
    expect(parseItemCountText('')).toBeNull();
    expect(parseItemCountText('030')).toBe(30);
  });

  it('is 1 to the smaller of 100 and the topic\'s questions', () => {
    expect(clampItemCount(0, 84)).toBe(1);
    expect(clampItemCount(200, 84)).toBe(84);
    expect(clampItemCount(200, 500)).toBe(100);
    expect(clampItemCount(5, 0)).toBe(1);
  });

  it('says what is wrong with what was typed', () => {
    expect(describeItemCount(30, 84)).toEqual({ text: '1 to 84 items', isValid: true });
    expect(describeItemCount(90, 84)).toEqual({ text: 'Max 84 (topic has 84)', isValid: false });
    expect(describeItemCount(0, 84)).toEqual({ text: 'Enter 1 to 84', isValid: false });
    expect(describeItemCount(null, 84).isValid).toBe(false);
    expect(describeItemCount(150, 500)).toEqual({ text: 'Max 100 items', isValid: false });
    expect(describeItemCount(1, 0)).toEqual({ text: 'This topic has no questions yet', isValid: false });
  });

  it('suggests a name, numbered after the first exam on the topic', () => {
    expect(suggestExamName(' Pharmacology ', 0)).toBe('Pharmacology');
    expect(suggestExamName('Pharmacology', 4)).toBe('Pharmacology #5');
  });
});

describe('the schedule and its reminder', () => {
  it('puts the chosen day and clock time together, seconds cleared', () => {
    const when = composeScheduledAt(new Date(2026, 10, 26, 3, 4, 5), new Date(2000, 0, 1, 19, 30, 59));
    expect(new Date(when)).toEqual(new Date(2026, 10, 26, 19, 30, 0, 0));
  });

  it('rings the chosen minutes before, or not at all without minutes', () => {
    const start = new Date(2026, 10, 26, 19, 0).getTime();
    const now = new Date(2026, 10, 26, 12, 0).getTime();
    expect(computeReminderAt(start, 30, now)).toBe(new Date(2026, 10, 26, 18, 30).getTime());
    expect(computeReminderAt(start, 0, now)).toBe(start);
    expect(computeReminderAt(start, null, now)).toBeNull();
  });

  it('skips a reminder whose moment has passed', () => {
    const start = new Date(2026, 10, 26, 19, 0).getTime();
    expect(computeReminderAt(start, 30, new Date(2026, 10, 26, 18, 45).getTime())).toBeNull();
    expect(isScheduleInPast(start, start)).toBe(true);
    expect(isScheduleInPast(start, start - 1)).toBe(false);
  });

  it('reads the minutes box', () => {
    expect(parseRemindMinutes('45')).toBe(45);
    expect(parseRemindMinutes('')).toBeNull();
    expect(parseRemindMinutes('12345')).toBe(1234);
  });

  it('starts the schedule tonight at 7 PM, or tomorrow when that is under an hour away', () => {
    expect(buildDefaultSchedule(new Date(2026, 10, 24, 10, 0)).day).toEqual(new Date(2026, 10, 24, 19, 0));
    expect(buildDefaultSchedule(new Date(2026, 10, 24, 18, 30)).day).toEqual(new Date(2026, 10, 25, 19, 0));
  });
});
