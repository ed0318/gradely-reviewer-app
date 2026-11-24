import type { AttemptChoice, AttemptQuestion, TopicQuestion } from '@/db/records';

/** A question as an attempt keeps it, before it has an id or a place. */
export type QuestionDraft = Omit<AttemptQuestion, 'id' | 'attemptId' | 'position'>;

/** Returns a number from 0 up to, not including, 1. Injected so tests and the dev seed are repeatable. */
export type RandomSource = () => number;

export type ArrangeOptions = { shuffleQuestions: boolean; shuffleChoices: boolean };

/** A copy in random order (Fisher-Yates). */
export function shuffleItems<T>(items: readonly T[], random: RandomSource): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
}

/** `count` of the ids at random, kept in their original order. All of them when there are no more than `count`. */
export function pickQuestionIds(ids: readonly string[], count: number, random: RandomSource): string[] {
  if (count >= ids.length) return [...ids];
  const chosen = new Set(shuffleItems(ids, random).slice(0, Math.max(0, count)));
  return ids.filter((id) => chosen.has(id));
}

export function draftFromTopicQuestion(question: TopicQuestion): QuestionDraft {
  const base = { question: question.question, point: question.point };
  switch (question.type) {
    case 'multiple':
      return { ...base, type: 'multiple', answer: null, choices: question.choices.map((choice) => ({ choiceText: choice.choiceText, isCorrect: choice.isCorrect })) };
    case 'truefalse':
      return { ...base, type: 'truefalse', answer: question.answerIsTrue ? 'true' : 'false', choices: null };
    case 'identification':
      return { ...base, type: 'identification', answer: question.answer, choices: null };
    case 'essay':
      return { ...base, type: 'essay', answer: question.answerGuide, choices: null };
  }
}

export function draftFromAttemptQuestion(question: AttemptQuestion): QuestionDraft {
  return { type: question.type, question: question.question, point: question.point, answer: question.answer, choices: question.choices };
}

/** Puts the drafts in order (shuffled or as given), shuffles each multiple-choice list if asked, and numbers them from 1. */
export function arrangeAttemptQuestions(
  attemptId: string,
  drafts: readonly QuestionDraft[],
  options: ArrangeOptions,
  random: RandomSource,
  createId: () => string,
): AttemptQuestion[] {
  const ordered = options.shuffleQuestions ? shuffleItems(drafts, random) : [...drafts];
  return ordered.map((draft, index) => ({
    ...draft,
    choices: draft.choices && options.shuffleChoices ? shuffleItems<AttemptChoice>(draft.choices, random) : draft.choices,
    id: createId(),
    attemptId,
    position: index + 1,
  }));
}
