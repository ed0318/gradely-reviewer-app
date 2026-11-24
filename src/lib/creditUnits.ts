/**
 * Credits are stored and computed as whole units: 1 credit = 4 units, and one
 * exam item costs exactly 1 unit (0.25 credit). Units turn into credits only for
 * display, so no float ever touches a balance. The price per item is set here
 * and on the server (reviewer-api charges it); the two must match.
 */
export const UNITS_PER_CREDIT = 4;
export const UNITS_PER_EXAM_ITEM = 1;
export const MAX_EXAM_ITEMS = 100;

/** Whole credits (a pack size) as units. Throws on a fraction, which only display code may produce. */
export function convertCreditsToUnits(credits: number): number {
  if (!Number.isInteger(credits)) throw new RangeError(`Whole credits only, got ${credits}.`);
  return credits * UNITS_PER_CREDIT;
}

/** What an exam of `itemCount` items costs, in units. */
export function calculateExamCostUnits(itemCount: number): number {
  if (!Number.isInteger(itemCount) || itemCount < 1 || itemCount > MAX_EXAM_ITEMS) {
    throw new RangeError(`An exam has 1 to ${MAX_EXAM_ITEMS} items, got ${itemCount}.`);
  }
  return itemCount * UNITS_PER_EXAM_ITEM;
}

/** The most items an exam on a topic with `questionCount` questions can have. */
export function findMaxExamItems(questionCount: number): number {
  return Math.max(0, Math.min(MAX_EXAM_ITEMS, Math.floor(questionCount)));
}

const QUARTER_SUFFIXES = ['', '.25', '.5', '.75'] as const;

/**
 * Units as a credit amount for display: 30 → "7.5", 1 → "0.25",
 * 6080 → "1,520". Integer math only.
 */
export function formatCredits(units: number): string {
  if (!Number.isInteger(units)) throw new RangeError(`Units are whole numbers, got ${units}.`);
  const sign = units < 0 ? '−' : '';
  const absolute = Math.abs(units);
  const wholeCredits = Math.floor(absolute / UNITS_PER_CREDIT);
  const quarter = absolute % UNITS_PER_CREDIT;
  return `${sign}${wholeCredits.toLocaleString('en-US')}${QUARTER_SUFFIXES[quarter]}`;
}
