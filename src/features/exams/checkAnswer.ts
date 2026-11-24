import type { AttemptQuestion } from '@/db/records';

/**
 * The checking rules for the four question types.
 *
 * - multiple choice: the chosen option (stored as its place in the shown list) must be the right one.
 * - true or false: must match exactly.
 * - identification: capital letters and extra spaces do not count.
 * - essay: not checked by the app. It waits for the student to mark it against the answer guide.
 *
 * A question left blank is wrong, an essay included.
 */

/** Lower case, trimmed, and every run of spaces made one, so "  Jose   RIZAL " matches "jose rizal". */
export function normalizeTypedAnswer(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export type CheckedQuestion = Pick<AttemptQuestion, 'type' | 'answer' | 'choices'>;

/** True or false for a question the app can check; null for an essay that has an answer to mark. */
export function checkAnswer(question: CheckedQuestion, givenAnswer: string | null): boolean | null {
  const given = givenAnswer ?? '';
  if (given.trim() === '') return false;
  switch (question.type) {
    case 'multiple': {
      const chosenIndex = Number(given);
      if (!Number.isInteger(chosenIndex)) return false;
      return question.choices?.[chosenIndex]?.isCorrect === true;
    }
    case 'truefalse':
      return given === question.answer;
    case 'identification':
      return normalizeTypedAnswer(given) === normalizeTypedAnswer(question.answer ?? '');
    case 'essay':
      return null;
  }
}
