import { QUESTION_TYPES, type QuestionType, type TopicQuestion } from '@/db/records';

/**
 * The rules for a question, copied from gradely-app's exam editor
 * (src/data/exams.ts) so a Gradely exam can become a topic later and the same
 * wording greets the same mistake.
 */

export { QUESTION_TYPES };

export const TYPE_LABEL: Record<QuestionType, string> = {
  multiple: 'Multiple choice',
  truefalse: 'True or false',
  identification: 'Identification',
  essay: 'Essay',
};

/** Shorter names for the type control. */
export const TYPE_SHORT: Record<QuestionType, string> = {
  multiple: 'Multiple',
  truefalse: 'T / F',
  identification: 'Short',
  essay: 'Essay',
};

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;
export const MIN_LINES = 1;
export const MAX_LINES = 20;
export const DEFAULT_CHOICE_COUNT = 4;
export const DEFAULT_LINES = 4;

/** A, B, C… for a choice's position. The letters are never stored. */
export const choiceLetter = (index: number): string => String.fromCharCode(65 + index);

/** Why one question is not ready to be used in an exam, or null when it is. Gradely's wording. */
export function findQuestionProblem(question: TopicQuestion): string | null {
  if (!question.question.trim()) return 'Needs a question';
  if (!(question.point > 0)) return 'Needs points';
  switch (question.type) {
    case 'multiple': {
      if (question.choices.length < MIN_CHOICES) return 'Needs at least two choices';
      const blankAt = question.choices.findIndex((choice) => !choice.choiceText.trim());
      if (blankAt >= 0) return `Fill in choice ${choiceLetter(blankAt)} or remove it`;
      if (question.choices.filter((choice) => choice.isCorrect).length !== 1) return 'Pick the correct choice';
      return null;
    }
    case 'identification':
      return question.answer.trim() ? null : 'Needs an answer';
    // True or false always has one of the two picked; an essay's guide is optional.
    case 'truefalse':
    case 'essay':
      return null;
  }
}

/** The placeholder under an empty QUESTION field, by type. */
export const QUESTION_PLACEHOLDER: Record<QuestionType, string> = {
  multiple: 'e.g. What is 3/4 + 1/8?',
  truefalse: 'e.g. A fraction can be greater than 1.',
  identification: 'e.g. The top number of a fraction.',
  essay: 'e.g. Explain why 0.5 = 1/2.',
};

/** A question nobody typed anything into: the tap on "Add question" that went nowhere. */
export function isUntouchedQuestion(question: TopicQuestion): boolean {
  if (question.question.trim()) return false;
  switch (question.type) {
    case 'multiple':
      return question.choices.every((choice) => !choice.choiceText.trim());
    case 'identification':
      return !question.answer.trim();
    // True or false starts with an answer picked, which is not typing.
    case 'truefalse':
      return true;
    case 'essay':
      return !(question.answerGuide ?? '').trim();
  }
}

/** The small label under a question in the list: "Answer B", "False", "Quotient", "Answer guide". */
export function describeAnswer(question: TopicQuestion): string {
  switch (question.type) {
    case 'multiple': {
      const correctAt = question.choices.findIndex((choice) => choice.isCorrect);
      return correctAt >= 0 ? `Answer ${choiceLetter(correctAt)}` : 'No answer picked';
    }
    case 'truefalse':
      return question.answerIsTrue ? 'True' : 'False';
    case 'identification':
      return question.answer.trim() || 'No answer yet';
    case 'essay':
      return question.answerGuide?.trim() ? 'Answer guide' : 'No guide';
  }
}

export const describePoints = (point: number): string => `${point} ${point === 1 ? 'pt' : 'pts'}`;

/** Parses the POINTS box. Anything that is not a positive number is 0, which "Needs points" then flags. */
export function parsePoints(text: string): number {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}
