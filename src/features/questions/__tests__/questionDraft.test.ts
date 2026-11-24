import { describe, expect, it } from 'vitest';
import type { TopicQuestion } from '@/db/records';
import { applyDraftChange, buildBlankQuestion } from '../questionDraft';

const counter = () => {
  let next = 0;
  return () => `id-${(next += 1)}`;
};
type Multiple = Extract<TopicQuestion, { type: 'multiple' }>;
const blankMultiple = () => buildBlankQuestion('multiple', 'topic-1', 'q1', counter()) as Multiple;

describe('question draft', () => {
  it('starts a multiple-choice question with four empty choices and none correct', () => {
    const question = blankMultiple();
    expect(question.choices).toHaveLength(4);
    expect(question.choices.every((choice) => choice.choiceText === '' && !choice.isCorrect)).toBe(true);
    expect(new Set(question.choices.map((choice) => choice.id)).size).toBe(4);
    expect(question.point).toBe(1);
  });

  it('marks exactly one choice correct', () => {
    const makeId = counter();
    let question: TopicQuestion = blankMultiple();
    question = applyDraftChange(question, { kind: 'correctChoice', index: 1 }, makeId);
    question = applyDraftChange(question, { kind: 'correctChoice', index: 3 }, makeId);
    expect((question as Multiple).choices.map((choice) => choice.isCorrect)).toEqual([false, false, false, true]);
  });

  it('adds up to six choices and removes down to two', () => {
    const makeId = counter();
    let question: TopicQuestion = blankMultiple();
    for (let step = 0; step < 5; step += 1) question = applyDraftChange(question, { kind: 'addChoice' }, makeId);
    expect((question as Multiple).choices).toHaveLength(6);
    for (let step = 0; step < 6; step += 1) question = applyDraftChange(question, { kind: 'removeChoice', index: 0 }, makeId);
    expect((question as Multiple).choices).toHaveLength(2);
  });

  it('moves the letters up when a choice is removed, and the correct mark goes with its choice', () => {
    const makeId = counter();
    let question: TopicQuestion = blankMultiple();
    for (const [index, text] of ['one', 'two', 'three', 'four'].entries()) question = applyDraftChange(question, { kind: 'choiceText', index, text }, makeId);
    question = applyDraftChange(question, { kind: 'correctChoice', index: 2 }, makeId);
    question = applyDraftChange(question, { kind: 'removeChoice', index: 0 }, makeId);
    expect((question as Multiple).choices.map((choice) => [choice.choiceText, choice.isCorrect])).toEqual([
      ['two', false],
      ['three', true],
      ['four', false],
    ]);
    // Removing the correct one leaves none correct, which the rules then flag.
    question = applyDraftChange(question, { kind: 'removeChoice', index: 1 }, makeId);
    expect((question as Multiple).choices.some((choice) => choice.isCorrect)).toBe(false);
  });

  it('keeps wording and points when the type changes, and drops the rest', () => {
    const makeId = counter();
    let question: TopicQuestion = blankMultiple();
    question = applyDraftChange(question, { kind: 'wording', text: 'Is it so?' }, makeId);
    question = applyDraftChange(question, { kind: 'points', value: 3 }, makeId);
    const changed = applyDraftChange(question, { kind: 'type', type: 'truefalse' }, makeId);
    expect(changed).toMatchObject({ id: 'q1', topicId: 'topic-1', type: 'truefalse', question: 'Is it so?', point: 3, answerIsTrue: true });
    expect(applyDraftChange(changed, { kind: 'type', type: 'truefalse' }, makeId)).toBe(changed);
  });

  it('ignores a change that does not fit the type', () => {
    const makeId = counter();
    const question: TopicQuestion = { id: 'a', topicId: 't', question: 'Q', point: 1, sortingOrder: 0, type: 'identification', answer: '' };
    expect(applyDraftChange(question, { kind: 'addChoice' }, makeId)).toBe(question);
    expect(applyDraftChange(question, { kind: 'answer', text: 'Quotient' }, makeId)).toMatchObject({ answer: 'Quotient' });
  });

  it('keeps an essay\'s lines between 1 and 20', () => {
    const makeId = counter();
    const essay = buildBlankQuestion('essay', 't', 'e', makeId);
    expect(applyDraftChange(essay, { kind: 'lines', value: 99 }, makeId)).toMatchObject({ lines: 20 });
    expect(applyDraftChange(essay, { kind: 'lines', value: 0 }, makeId)).toMatchObject({ lines: 1 });
  });
});
