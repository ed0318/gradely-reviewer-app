import type { AttemptAnswer, AttemptQuestion } from '@/db/records';
import { calculateExamCostUnits } from '@/lib/creditUnits';
import { findMissedQuestions } from './scoreAttempt';

export type RetakeOption = { itemCount: number; costUnits: number };

export type RetakeOptions = {
  /** Every question again, in a new order. */
  shuffled: RetakeOption;
  /** Only the ones missed. Null when nothing was missed. */
  missed: RetakeOption | null;
};

/**
 * What the two retake buttons offer and cost. A retake is a new attempt and is
 * charged like one: a unit per item, so retaking only the missed ones costs
 * only for those.
 */
export function buildRetakeOptions(questions: readonly AttemptQuestion[], answers: readonly AttemptAnswer[]): RetakeOptions {
  const missedCount = findMissedQuestions(questions, answers).length;
  return {
    shuffled: { itemCount: questions.length, costUnits: calculateExamCostUnits(questions.length) },
    missed: missedCount > 0 ? { itemCount: missedCount, costUnits: calculateExamCostUnits(missedCount) } : null,
  };
}
