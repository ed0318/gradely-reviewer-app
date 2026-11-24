import { describe, expect, it } from 'vitest';
import type { AttemptAnswer, AttemptQuestion } from '@/db/records';
import { buildRetakeOptions } from '../retakeOptions';
import { buildResultItems, selectItemsToReview } from '../resultItems';
import { findMissedQuestions, judgeQuestion, roundPoints, scoreAttempt } from '../scoreAttempt';

const question = (id: string, overrides: Partial<AttemptQuestion>): AttemptQuestion => ({
  id,
  attemptId: 'attempt',
  position: 1,
  type: 'truefalse',
  question: `Question ${id}`,
  point: 1,
  answer: 'true',
  choices: null,
  ...overrides,
});
const answer = (questionId: string, givenAnswer: string | null, isCorrect: boolean | null = null): AttemptAnswer => ({
  id: `answer-${questionId}`,
  attemptQuestionId: questionId,
  givenAnswer,
  isCorrect,
  isFlagged: false,
});

const QUESTIONS: AttemptQuestion[] = [
  question('mc', { type: 'multiple', answer: null, choices: [{ choiceText: 'Wrong', isCorrect: false }, { choiceText: 'Right', isCorrect: true }] }),
  question('tf', {}),
  question('id', { type: 'identification', answer: 'Mitochondrion', point: 2 }),
  question('essay', { type: 'essay', answer: 'A guide.', point: 5 }),
];

describe('scoring an attempt', () => {
  it('adds the points of the right answers', () => {
    const answers = [answer('mc', '1'), answer('tf', 'false'), answer('id', ' mitochondrion '), answer('essay', 'My essay', true)];
    expect(scoreAttempt(QUESTIONS, answers)).toEqual({ score: 8, totalPoints: 9, pendingCount: 0 });
  });

  it('counts a blank as wrong', () => {
    expect(scoreAttempt(QUESTIONS, [])).toEqual({ score: 0, totalPoints: 9, pendingCount: 0 });
  });

  it('leaves an essay waiting for its mark out of the score and the total', () => {
    const answers = [answer('mc', '1'), answer('tf', 'true'), answer('id', 'x'), answer('essay', 'My essay', null)];
    expect(scoreAttempt(QUESTIONS, answers)).toEqual({ score: 2, totalPoints: 4, pendingCount: 1 });
  });

  it('counts a marked essay like any other question: full points if right, none if wrong', () => {
    const marked = (isCorrect: boolean) => [answer('mc', '1'), answer('essay', 'My essay', isCorrect)];
    expect(scoreAttempt(QUESTIONS, marked(true))).toMatchObject({ score: 6, totalPoints: 9 });
    expect(scoreAttempt(QUESTIONS, marked(false))).toMatchObject({ score: 1, totalPoints: 9 });
  });

  it('keeps float dust out of the points', () => {
    const halves = [question('a', { point: 0.1 }), question('b', { point: 0.2 })];
    expect(scoreAttempt(halves, [answer('a', 'true'), answer('b', 'true')]).score).toBe(0.3);
    expect(roundPoints(0.1 + 0.2)).toBe(0.3);
  });

  it('judges an essay left blank as wrong, not pending', () => {
    expect(judgeQuestion(QUESTIONS[3], answer('essay', '  '))).toBe('wrong');
    expect(judgeQuestion(QUESTIONS[3], undefined)).toBe('wrong');
  });
});

describe('the missed questions and the retake', () => {
  const answers = [answer('mc', '0'), answer('tf', 'true'), answer('id', ''), answer('essay', 'My essay', null)];

  it('finds the ones answered wrong or left blank, in order, and not an essay still to be marked', () => {
    expect(findMissedQuestions(QUESTIONS, answers).map((missed) => missed.id)).toEqual(['mc', 'id']);
  });

  it('counts an essay marked wrong as missed', () => {
    const marked = answers.map((item) => (item.attemptQuestionId === 'essay' ? { ...item, isCorrect: false } : item));
    expect(findMissedQuestions(QUESTIONS, marked).map((missed) => missed.id)).toEqual(['mc', 'id', 'essay']);
  });

  it('charges a retake by its items: every question for the shuffled one, only the missed for the other', () => {
    expect(buildRetakeOptions(QUESTIONS, answers)).toEqual({ shuffled: { itemCount: 4, costUnits: 4 }, missed: { itemCount: 2, costUnits: 2 } });
  });

  it('offers no missed-only retake when nothing was missed', () => {
    const perfect = [answer('mc', '1'), answer('tf', 'true'), answer('id', 'mitochondrion'), answer('essay', 'x', true)];
    expect(buildRetakeOptions(QUESTIONS, perfect).missed).toBeNull();
  });
});

describe('the results items', () => {
  it('shows the given and the right answer as words, and what is left to review', () => {
    const items = buildResultItems(QUESTIONS, [answer('mc', '0'), answer('tf', 'true'), answer('essay', 'My essay', null)]);
    expect(items[0]).toMatchObject({ number: 1, verdict: 'wrong', givenText: 'Wrong', correctText: 'Right', isBlank: false });
    expect(items[1]).toMatchObject({ verdict: 'correct', givenText: 'True' });
    expect(items[2]).toMatchObject({ verdict: 'wrong', givenText: '(no answer)', correctText: 'Mitochondrion', isBlank: true });
    expect(items[3]).toMatchObject({ verdict: 'pending', correctText: 'A guide.' });
    expect(selectItemsToReview(items).map((item) => item.id)).toEqual(['mc', 'id', 'essay']);
  });
});
