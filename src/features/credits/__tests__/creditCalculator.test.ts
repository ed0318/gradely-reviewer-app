import { describe, expect, it } from 'vitest';
import { cleanItemsText, countItemsInPack, describeItemsAsCredits, formatPesos, parseItemsText, stepItems } from '../creditCalculator';

describe('the items → credits calculator', () => {
  it('turns items into credits at 0.25 each, in whole units', () => {
    expect(describeItemsAsCredits(30)).toBe('7.5');
    expect(describeItemsAsCredits(1)).toBe('0.25');
    expect(describeItemsAsCredits(3)).toBe('0.75');
    expect(describeItemsAsCredits(100)).toBe('25');
    expect(describeItemsAsCredits(0)).toBe('0');
  });

  it('says how many items a pack pays for: the 280-credit pack is 1,120 items', () => {
    expect(countItemsInPack(280 * 4)).toBe(1_120);
    expect(countItemsInPack(150 * 4)).toBe(600);
    expect(countItemsInPack(380 * 4)).toBe(1_520);
  });

  it('keeps typed text to three digits and a number to the most an exam holds', () => {
    expect(cleanItemsText('1a2b3c4')).toBe('123');
    expect(parseItemsText('')).toBe(0);
    expect(parseItemsText('45')).toBe(45);
    expect(parseItemsText('999')).toBe(100);
  });

  it('steps one item at a time, between 1 and 100', () => {
    expect(stepItems(30, 1)).toBe(31);
    expect(stepItems(1, -1)).toBe(1);
    expect(stepItems(100, 1)).toBe(100);
    expect(stepItems(0, 1)).toBe(1);
  });

  it('writes prices from centavos without floats', () => {
    expect(formatPesos(14_900)).toBe('₱149');
    expect(formatPesos(24_900)).toBe('₱249');
    expect(formatPesos(124_900)).toBe('₱1,249');
    expect(formatPesos(14_950)).toBe('₱149.50');
    expect(formatPesos(14_905)).toBe('₱149.05');
  });
});
