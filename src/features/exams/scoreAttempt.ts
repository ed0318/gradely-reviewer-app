import type { AttemptAnswer, AttemptQuestion } from '@/db/records';
import { checkAnswer } from './checkAnswer';

/**
 * Scoring an attempt.
 *
 * A question is right, wrong, or (an essay with an answer not yet marked)
 * pending. Points are the question's own. A pending essay is left out of both
 * the score and the total until the student marks it, so the percentage is not
 * dragged down by work that has not been judged. Once marked, an essay counts
 * like any other question: full points if right, none if wrong.
 */

export type Verdict = 'correct' | 'wrong' | 'pending';

export type AttemptScoreSummary = {
  score: number;
  totalPoints: number;
  pendingCount: number;
};

/** Points are typed by hand, so keep sums free of float dust (0.1 + 0.2). */
export function roundPoints(points: number): number {
  return Math.round(points * 100) / 100;
}

export function judgeQuestion(question: AttemptQuestion, answer: AttemptAnswer | undefined): Verdict {
  const checked = checkAnswer(question, answer?.givenAnswer ?? null);
  if (checked !== null) return checked ? 'correct' : 'wrong';
  // An essay with writing in it: the student's own mark decides, and until then it is pending.
  const marked = answer?.isCorrect;
  if (marked === null || marked === undefined) return 'pending';
  return marked ? 'correct' : 'wrong';
}

export function indexAnswers(answers: readonly AttemptAnswer[]): Map<string, AttemptAnswer> {
  return new Map(answers.map((answer) => [answer.attemptQuestionId, answer]));
}

export function scoreAttempt(questions: readonly AttemptQuestion[], answers: readonly AttemptAnswer[]): AttemptScoreSummary {
  const byQuestion = indexAnswers(answers);
  let score = 0;
  let totalPoints = 0;
  let pendingCount = 0;
  for (const question of questions) {
    const verdict = judgeQuestion(question, byQuestion.get(question.id));
    if (verdict === 'pending') {
      pendingCount += 1;
      continue;
    }
    totalPoints += question.point;
    if (verdict === 'correct') score += question.point;
  }
  return { score: roundPoints(score), totalPoints: roundPoints(totalPoints), pendingCount };
}

/** The questions answered wrong or left blank, in the order asked. Pending essays are not missed yet. */
export function findMissedQuestions(questions: readonly AttemptQuestion[], answers: readonly AttemptAnswer[]): AttemptQuestion[] {
  const byQuestion = indexAnswers(answers);
  return questions.filter((question) => judgeQuestion(question, byQuestion.get(question.id)) === 'wrong');
}
