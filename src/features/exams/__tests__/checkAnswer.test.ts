import { describe, expect, it } from 'vitest';
import type { CheckedQuestion } from '../checkAnswer';
import { checkAnswer, normalizeTypedAnswer } from '../checkAnswer';

const multiple: CheckedQuestion = { type: 'multiple', answer: null, choices: [{ choiceText: 'A', isCorrect: false }, { choiceText: 'B', isCorrect: true }, { choiceText: 'C', isCorrect: false }] };
const trueFalse: CheckedQuestion = { type: 'truefalse', answer: 'true', choices: null };
const identification: CheckedQuestion = { type: 'identification', answer: 'Jose Rizal', choices: null };
const essay: CheckedQuestion = { type: 'essay', answer: 'A guide.', choices: null };

describe('checking multiple choice', () => {
  it('is right only for the right option, by its place in the shown list', () => {
    expect(checkAnswer(multiple, '1')).toBe(true);
    expect(checkAnswer(multiple, '0')).toBe(false);
    expect(checkAnswer(multiple, '2')).toBe(false);
  });
  it('is wrong for a blank, a stranger or an option that is not there', () => {
    expect(checkAnswer(multiple, null)).toBe(false);
    expect(checkAnswer(multiple, '')).toBe(false);
    expect(checkAnswer(multiple, 'B')).toBe(false);
    expect(checkAnswer(multiple, '9')).toBe(false);
  });
});

describe('checking true or false', () => {
  it('must match exactly', () => {
    expect(checkAnswer(trueFalse, 'true')).toBe(true);
    expect(checkAnswer(trueFalse, 'false')).toBe(false);
    expect(checkAnswer({ ...trueFalse, answer: 'false' }, 'false')).toBe(true);
    expect(checkAnswer(trueFalse, null)).toBe(false);
  });
});

describe('checking identification', () => {
  it('ignores capital letters', () => {
    expect(checkAnswer(identification, 'JOSE RIZAL')).toBe(true);
    expect(checkAnswer(identification, 'jose rizal')).toBe(true);
  });
  it('ignores extra spaces at the ends and between words', () => {
    expect(checkAnswer(identification, '  Jose    Rizal  ')).toBe(true);
    expect(checkAnswer(identification, 'Jose\tRizal')).toBe(true);
  });
  it('does not forgive a different word, a missing word, or a blank', () => {
    expect(checkAnswer(identification, 'Rizal')).toBe(false);
    expect(checkAnswer(identification, 'Joserizal')).toBe(false);
    expect(checkAnswer(identification, '   ')).toBe(false);
  });
  it('normalizes the same way for both sides', () => {
    expect(normalizeTypedAnswer('  É  Ñ ')).toBe(normalizeTypedAnswer('é ñ'));
  });
});

describe('checking an essay', () => {
  it('is left for the student to mark when there is writing, and wrong when there is none', () => {
    expect(checkAnswer(essay, 'I think that...')).toBeNull();
    expect(checkAnswer(essay, '   ')).toBe(false);
    expect(checkAnswer(essay, null)).toBe(false);
  });
});
