import type { QuestionChoice, QuestionType, TopicQuestion } from '@/db/records';
import { DEFAULT_CHOICE_COUNT, DEFAULT_LINES, MAX_CHOICES, MAX_LINES, MIN_CHOICES, MIN_LINES } from './questionRules';

/** Makes a new row id. Passed in so this file stays pure and testable without the native crypto module. */
export type MakeId = () => string;

/** Everything the editor can do to the question it holds. */
export type DraftChange =
  | { kind: 'type'; type: QuestionType }
  | { kind: 'wording'; text: string }
  | { kind: 'points'; value: number }
  | { kind: 'choiceText'; index: number; text: string }
  | { kind: 'correctChoice'; index: number }
  | { kind: 'addChoice' }
  | { kind: 'removeChoice'; index: number }
  | { kind: 'answerIsTrue'; value: boolean }
  | { kind: 'answer'; text: string }
  | { kind: 'answerGuide'; text: string }
  | { kind: 'lines'; value: number };

const buildBlankChoices = (count: number, makeId: MakeId): QuestionChoice[] =>
  Array.from({ length: count }, () => ({ id: makeId(), choiceText: '', isCorrect: false }));

/** A new, empty question of this type, not yet placed (the repository gives it its place). */
export function buildBlankQuestion(type: QuestionType, topicId: string, id: string, makeId: MakeId): TopicQuestion {
  const base = { id, topicId, question: '', point: 1, sortingOrder: 0 };
  switch (type) {
    case 'multiple':
      return { ...base, type, choices: buildBlankChoices(DEFAULT_CHOICE_COUNT, makeId) };
    case 'truefalse':
      return { ...base, type, answerIsTrue: true };
    case 'identification':
      return { ...base, type, answer: '' };
    case 'essay':
      return { ...base, type, answerGuide: null, lines: DEFAULT_LINES };
  }
}

/** What a question becomes when its type changes: it keeps its wording and points and sheds the rest. */
function retype(question: TopicQuestion, type: QuestionType, makeId: MakeId): TopicQuestion {
  if (question.type === type) return question;
  const fresh = buildBlankQuestion(type, question.topicId, question.id, makeId);
  return { ...fresh, question: question.question, point: question.point, sortingOrder: question.sortingOrder };
}

/** Applies one change to a question and returns the new one. A change that does not fit the type is ignored. */
export function applyDraftChange(question: TopicQuestion, change: DraftChange, makeId: MakeId): TopicQuestion {
  if (change.kind === 'type') return retype(question, change.type, makeId);
  if (change.kind === 'wording') return { ...question, question: change.text };
  if (change.kind === 'points') return { ...question, point: change.value };

  switch (question.type) {
    case 'multiple':
      return applyChoiceChange(question, change, makeId);
    case 'truefalse':
      return change.kind === 'answerIsTrue' ? { ...question, answerIsTrue: change.value } : question;
    case 'identification':
      return change.kind === 'answer' ? { ...question, answer: change.text } : question;
    case 'essay':
      if (change.kind === 'answerGuide') return { ...question, answerGuide: change.text };
      if (change.kind === 'lines') return { ...question, lines: Math.min(MAX_LINES, Math.max(MIN_LINES, Math.round(change.value))) };
      return question;
  }
}

function applyChoiceChange(question: Extract<TopicQuestion, { type: 'multiple' }>, change: DraftChange, makeId: MakeId): TopicQuestion {
  const { choices } = question;
  switch (change.kind) {
    case 'choiceText':
      return { ...question, choices: choices.map((choice, index) => (index === change.index ? { ...choice, choiceText: change.text } : choice)) };
    case 'correctChoice':
      return { ...question, choices: choices.map((choice, index) => ({ ...choice, isCorrect: index === change.index })) };
    case 'addChoice':
      if (choices.length >= MAX_CHOICES) return question;
      return { ...question, choices: [...choices, { id: makeId(), choiceText: '', isCorrect: false }] };
    case 'removeChoice':
      // Letters are positions, so later choices move up; the correct mark goes with its choice and is gone if that was it.
      if (choices.length <= MIN_CHOICES) return question;
      return { ...question, choices: choices.filter((_, index) => index !== change.index) };
    default:
      return question;
  }
}
