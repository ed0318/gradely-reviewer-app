import { MAX_EXAM_ITEMS, UNITS_PER_EXAM_ITEM, formatCredits } from '@/lib/creditUnits';

/** The items → credits calculator on the Buy credits screen. Integer units all the way; credits are text. */

export const MIN_CALCULATOR_ITEMS = 1;
export const DEFAULT_CALCULATOR_ITEMS = 30;

/** The typed box: digits only, three at most. */
export function cleanItemsText(text: string): string {
  return text.replace(/\D/g, '').slice(0, 3);
}

/** What was typed as a whole number of items, kept inside 0 to the most an exam holds ("" is 0). */
export function parseItemsText(text: string): number {
  const items = Number.parseInt(cleanItemsText(text), 10);
  return Number.isFinite(items) ? Math.min(items, MAX_EXAM_ITEMS) : 0;
}

/** The − and + buttons: one item at a time, never below 1 or above the most an exam holds. */
export function stepItems(currentItems: number, direction: 1 | -1): number {
  return Math.min(MAX_EXAM_ITEMS, Math.max(MIN_CALCULATOR_ITEMS, currentItems + direction));
}

/** "7.5": the credits `items` items cost (0.25 each). */
export function describeItemsAsCredits(items: number): string {
  return formatCredits(items * UNITS_PER_EXAM_ITEM);
}

/** How many items a pack of `packUnits` units pays for: the 280-credit pack (1,120 units) is 1,120 items. */
export function countItemsInPack(packUnits: number): number {
  return Math.floor(packUnits / UNITS_PER_EXAM_ITEM);
}

/** "₱249" from centavos, whole pesos without decimals ("₱249", "₱1,249", "₱149.50"). Integer math. */
export function formatPesos(centavos: number): string {
  const pesos = Math.floor(centavos / 100);
  const remainder = centavos % 100;
  const whole = pesos.toLocaleString('en-US');
  return `₱${remainder === 0 ? whole : `${whole}.${String(remainder).padStart(2, '0')}`}`;
}
