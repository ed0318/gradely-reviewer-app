import { describe, expect, it } from 'vitest';
import type { TopicQuestion } from '@/db/records';
import { arrangeAttemptQuestions, draftFromTopicQuestion, pickQuestionIds, shuffleItems } from '../pickExamQuestions';
import { createSeededRandom } from '@/db/dev/dummyExamData';

describe('picking and arranging questions', () => {
  const ids = Array.from({ length: 20 }, (_, index) => `q${index}`);

  it('takes every question when the exam is as long as the topic', () => {
    expect(pickQuestionIds(ids, 20, Math.random)).toEqual(ids);
    expect(pickQuestionIds(ids, 50, Math.random)).toEqual(ids);
  });

  it('picks the asked number without repeats, kept in topic order', () => {
    const picked = pickQuestionIds(ids, 7, createSeededRandom(3));
    expect(picked).toHaveLength(7);
    expect(new Set(picked).size).toBe(7);
    expect(picked).toEqual([...picked].sort((a, b) => ids.indexOf(a) - ids.indexOf(b)));
  });

  it('shuffles into a new order without losing or adding anything', () => {
    const shuffled = shuffleItems(ids, createSeededRandom(1));
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(shuffled).not.toEqual(ids);
    expect(ids[0]).toBe('q0');
  });

  it('copies a topic question into the shape an attempt keeps', () => {
    const multiple: TopicQuestion = {
      id: 'q', topicId: 't', question: 'Pick one', point: 2, sortingOrder: 0, type: 'multiple',
      choices: [{ id: 'c1', choiceText: 'A', isCorrect: false }, { id: 'c2', choiceText: 'B', isCorrect: true }],
    };
    expect(draftFromTopicQuestion(multiple)).toEqual({ type: 'multiple', question: 'Pick one', point: 2, answer: null, choices: [{ choiceText: 'A', isCorrect: false }, { choiceText: 'B', isCorrect: true }] });
    expect(draftFromTopicQuestion({ id: 'q', topicId: 't', question: 'T?', point: 1, sortingOrder: 1, type: 'truefalse', answerIsTrue: false })).toMatchObject({ answer: 'false' });
    expect(draftFromTopicQuestion({ id: 'q', topicId: 't', question: 'E', point: 5, sortingOrder: 2, type: 'essay', answerGuide: null, lines: 6 })).toMatchObject({ type: 'essay', answer: null });
  });

  it('numbers from 1, keeps the order unless asked, and shuffles choices only when asked', () => {
    const drafts = ids.slice(0, 5).map((id, index) => draftFromTopicQuestion({
      id, topicId: 't', question: id, point: 1, sortingOrder: index, type: 'multiple',
      choices: ['A', 'B', 'C', 'D'].map((text, choice) => ({ id: `${id}${choice}`, choiceText: text, isCorrect: choice === 1 })),
    }));
    let counter = 0;
    const createId = () => `id-${(counter += 1)}`;
    const plain = arrangeAttemptQuestions('attempt', drafts, { shuffleQuestions: false, shuffleChoices: false }, createSeededRandom(2), createId);
    expect(plain.map((question) => question.question)).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']);
    expect(plain.map((question) => question.position)).toEqual([1, 2, 3, 4, 5]);
    expect(plain[0].choices?.map((choice) => choice.choiceText)).toEqual(['A', 'B', 'C', 'D']);

    const mixed = arrangeAttemptQuestions('attempt', drafts, { shuffleQuestions: true, shuffleChoices: true }, createSeededRandom(2), createId);
    expect(mixed.map((question) => question.question).sort()).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']);
    expect(mixed.some((question, index) => question.question !== `q${index}`)).toBe(true);
    // The right answer travels with its text: still exactly one, and it is still "B".
    for (const question of mixed) {
      expect(question.choices?.filter((choice) => choice.isCorrect).map((choice) => choice.choiceText)).toEqual(['B']);
    }
  });
});
