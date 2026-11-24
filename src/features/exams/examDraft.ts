import { calculateExamCostUnits, findMaxExamItems, UNITS_PER_EXAM_ITEM } from '@/lib/creditUnits';

/** The create-exam form's rules: how many items, what they cost, what is left. All integer units. */

export const DEFAULT_ITEM_COUNT = 30;

/** Digits only, at most three: the item box takes nothing else. */
export function cleanItemCountText(text: string): string {
  return text.replace(/\D/g, '').slice(0, 3);
}

/** The typed number, or null for an empty box. */
export function parseItemCountText(text: string): number | null {
  const digits = cleanItemCountText(text);
  return digits === '' ? null : Number.parseInt(digits, 10);
}

/** Keeps a count between 1 and the most the topic allows. */
export function clampItemCount(count: number, questionCount: number): number {
  const max = findMaxExamItems(questionCount);
  return Math.min(Math.max(count, 1), Math.max(max, 1));
}

export type ItemCountHint = { text: string; isValid: boolean };

/** "1 to 84 items", or what is wrong with what was typed. */
export function describeItemCount(typed: number | null, questionCount: number): ItemCountHint {
  const max = findMaxExamItems(questionCount);
  if (max === 0) return { text: 'This topic has no questions yet', isValid: false };
  if (typed === null || typed < 1) return { text: `Enter 1 to ${max}`, isValid: false };
  if (typed > max) return { text: questionCount < 100 ? `Max ${max} (topic has ${questionCount})` : `Max ${max} items`, isValid: false };
  return { text: `1 to ${max} items`, isValid: true };
}

/** What the count in the box costs. A count that is not valid yet costs as the nearest valid one, so the strip never blanks. */
export function costOfTypedCount(typed: number | null, questionCount: number): number {
  return calculateExamCostUnits(clampItemCount(typed ?? 1, questionCount));
}

/** The balance once the exam is paid for. Null while no balance has been reported. */
export function balanceAfterUnits(balanceUnits: number | null, costUnits: number): number | null {
  return balanceUnits === null ? null : balanceUnits - costUnits;
}

/** How many items a balance pays for. */
export function countAffordableItems(balanceUnits: number): number {
  return Math.max(0, Math.floor(balanceUnits / UNITS_PER_EXAM_ITEM));
}

/** "Topic title #3" for a topic that already has two exams; just the title for the first. */
export function suggestExamName(topicTitle: string, examsMadeFromTopic: number): string {
  const title = topicTitle.trim();
  return examsMadeFromTopic > 0 ? `${title} #${examsMadeFromTopic + 1}` : title;
}

export const MAX_EXAM_NAME_LENGTH = 120;
