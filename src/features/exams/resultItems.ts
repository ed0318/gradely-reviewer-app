import type { AttemptAnswer, AttemptQuestion } from '@/db/records';
import { indexAnswers, judgeQuestion, type Verdict } from './scoreAttempt';

/** One question as the results show it: what was asked, what was given, what was right. */
export type ResultItem = {
  id: string;
  number: number;
  question: string;
  type: AttemptQuestion['type'];
  verdict: Verdict;
  givenText: string;
  correctText: string;
  /** True when nothing was answered. */
  isBlank: boolean;
};

export const NO_ANSWER_TEXT = '(no answer)';

function describeGiven(question: AttemptQuestion, given: string | null): string {
  if (given === null || given.trim() === '') return NO_ANSWER_TEXT;
  switch (question.type) {
    case 'multiple':
      return question.choices?.[Number(given)]?.choiceText ?? NO_ANSWER_TEXT;
    case 'truefalse':
      return given === 'true' ? 'True' : 'False';
    default:
      return given.trim();
  }
}

function describeCorrect(question: AttemptQuestion): string {
  switch (question.type) {
    case 'multiple':
      return question.choices?.find((choice) => choice.isCorrect)?.choiceText ?? '';
    case 'truefalse':
      return question.answer === 'true' ? 'True' : 'False';
    case 'essay':
      return question.answer?.trim() ? question.answer.trim() : 'No answer guide was written for this question.';
    case 'identification':
      return question.answer ?? '';
  }
}

export function buildResultItems(questions: readonly AttemptQuestion[], answers: readonly AttemptAnswer[]): ResultItem[] {
  const byQuestion = indexAnswers(answers);
  return questions.map((question, index) => {
    const answer = byQuestion.get(question.id);
    const givenText = describeGiven(question, answer?.givenAnswer ?? null);
    return {
      id: question.id,
      number: index + 1,
      question: question.question,
      type: question.type,
      verdict: judgeQuestion(question, answer),
      givenText,
      correctText: describeCorrect(question),
      isBlank: givenText === NO_ANSWER_TEXT,
    };
  });
}

/** What still needs a look: wrong answers, and essays waiting for the student's mark. */
export function selectItemsToReview(items: readonly ResultItem[]): ResultItem[] {
  return items.filter((item) => item.verdict !== 'correct');
}
