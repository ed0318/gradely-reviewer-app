import { describe, expect, it } from 'vitest';
import type { TopicQuestion } from '@/db/records';
import { buildMultipleQuestion } from '@/db/testing/fixtures';
import { choiceLetter, describeAnswer, describePoints, findQuestionProblem, isUntouchedQuestion, parsePoints } from '../questionRules';

const multiple = (overrides: Partial<Extract<TopicQuestion, { type: 'multiple' }>> = {}) => buildMultipleQuestion(overrides);
const withChoices = (choices: Array<[string, boolean]>) =>
  multiple({ choices: choices.map(([choiceText, isCorrect], index) => ({ id: `c${index}`, choiceText, isCorrect })) });

describe('findQuestionProblem (Gradely wording)', () => {
  it('accepts a complete question of every type', () => {
    expect(findQuestionProblem(multiple())).toBeNull();
    expect(findQuestionProblem({ id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'truefalse', answerIsTrue: false })).toBeNull();
    expect(findQuestionProblem({ id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'identification', answer: 'Mitochondrion' })).toBeNull();
    expect(findQuestionProblem({ id: 'a', topicId: 't', question: 'Q', point: 5, sortingOrder: 0, type: 'essay', answerGuide: null, lines: 4 })).toBeNull();
  });

  it('needs wording and points first', () => {
    expect(findQuestionProblem(multiple({ question: '   ' }))).toBe('Needs a question');
    expect(findQuestionProblem(multiple({ point: 0 }))).toBe('Needs points');
  });

  it('needs two choices, none blank, and exactly one correct', () => {
    expect(findQuestionProblem(withChoices([['Only', true]]))).toBe('Needs at least two choices');
    expect(findQuestionProblem(withChoices([['A text', true], ['  ', false], ['C text', false]]))).toBe('Fill in choice B or remove it');
    expect(findQuestionProblem(withChoices([['A text', false], ['B text', false]]))).toBe('Pick the correct choice');
    expect(findQuestionProblem(withChoices([['A text', true], ['B text', true]]))).toBe('Pick the correct choice');
  });

  it('needs an identification answer', () => {
    const question: TopicQuestion = { id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'identification', answer: '  ' };
    expect(findQuestionProblem(question)).toBe('Needs an answer');
  });
});

describe('question helpers', () => {
  it('letters choices from their place', () => {
    expect([0, 1, 5].map(choiceLetter)).toEqual(['A', 'B', 'F']);
  });

  it('parses the points box: a positive number, else 0', () => {
    expect(parsePoints('2')).toBe(2);
    expect(parsePoints('1,5')).toBe(1.5);
    expect(parsePoints('')).toBe(0);
    expect(parsePoints('2.')).toBe(2);
    expect(parsePoints('-3')).toBe(0);
    expect(parsePoints('abc')).toBe(0);
  });

  it('describes the answer and the points for the list', () => {
    expect(describeAnswer(multiple())).toBe('Answer B');
    expect(describeAnswer({ id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'truefalse', answerIsTrue: false })).toBe('False');
    expect(describeAnswer({ id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'essay', answerGuide: 'x', lines: 3 })).toBe('Answer guide');
    expect(describePoints(1)).toBe('1 pt');
    expect(describePoints(5)).toBe('5 pts');
  });

  it('knows a question nobody typed into', () => {
    expect(isUntouchedQuestion(multiple({ question: '', choices: [{ id: 'a', choiceText: '', isCorrect: false }, { id: 'b', choiceText: '', isCorrect: false }] }))).toBe(true);
    expect(isUntouchedQuestion(multiple({ question: 'Typed' }))).toBe(false);
    expect(isUntouchedQuestion({ id: 'a', topicId: 't', question: '', point: 1, sortingOrder: 0, type: 'truefalse', answerIsTrue: true })).toBe(true);
  });
});
