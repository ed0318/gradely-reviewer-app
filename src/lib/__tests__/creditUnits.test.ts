import { describe, expect, it } from 'vitest';
import { calculateExamCostUnits, convertCreditsToUnits, findMaxExamItems, formatCredits, MAX_EXAM_ITEMS } from '../creditUnits';

describe('credit units', () => {
  it('charges 0.25 credit (1 unit) per item, so 30 items cost 30 units (7.5 credits)', () => {
    expect(calculateExamCostUnits(1)).toBe(1);
    expect(formatCredits(calculateExamCostUnits(1))).toBe('0.25');
    expect(calculateExamCostUnits(30)).toBe(30);
    expect(formatCredits(calculateExamCostUnits(30))).toBe('7.5');
  });

  it('turns the credit packs into units', () => {
    expect(convertCreditsToUnits(150)).toBe(600);
    expect(convertCreditsToUnits(280)).toBe(1_120);
    expect(convertCreditsToUnits(380)).toBe(1_520);
  });

  it('refuses fractional credits', () => {
    expect(() => convertCreditsToUnits(7.5)).toThrow(RangeError);
  });

  it('shows units as credits in quarters, without floats', () => {
    expect(formatCredits(0)).toBe('0');
    expect(formatCredits(1)).toBe('0.25');
    expect(formatCredits(2)).toBe('0.5');
    expect(formatCredits(3)).toBe('0.75');
    expect(formatCredits(600)).toBe('150');
    expect(formatCredits(6_081)).toBe('1,520.25');
    expect(formatCredits(-6)).toBe('-1.5');
    expect(() => formatCredits(0.5)).toThrow(RangeError);
  });

  it('allows 1 to 100 items', () => {
    expect(calculateExamCostUnits(MAX_EXAM_ITEMS)).toBe(100);
    expect(formatCredits(calculateExamCostUnits(MAX_EXAM_ITEMS))).toBe('25');
    expect(() => calculateExamCostUnits(0)).toThrow(RangeError);
    expect(() => calculateExamCostUnits(101)).toThrow(RangeError);
    expect(() => calculateExamCostUnits(2.5)).toThrow(RangeError);
  });

  it('caps an exam at the topic question count and at 100', () => {
    expect(findMaxExamItems(0)).toBe(0);
    expect(findMaxExamItems(12)).toBe(12);
    expect(findMaxExamItems(250)).toBe(100);
  });
});
