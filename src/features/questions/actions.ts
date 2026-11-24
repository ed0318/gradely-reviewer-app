import { queueWrite } from '@/db/client';
import type { TopicQuestion } from '@/db/records';
import { moveQuestionWithinSection } from '@/db/repositories/questionOrder';
import { deleteQuestion, insertQuestionInSection, restoreQuestion, saveEditedQuestion } from '@/db/repositories/questions';
import { createId } from '@/lib/ids';
import { announceTopicsChanged } from '@/features/topics/topicsChangeSignal';
import { buildBlankQuestion } from './questionDraft';

/** Adds an empty multiple-choice question at the end of its section, ready to be filled in. */
export function addBlankQuestion(topicId: string, now: number = Date.now()): Promise<TopicQuestion> {
  const question = buildBlankQuestion('multiple', topicId, createId(), createId);
  return queueWrite((database) => insertQuestionInSection(database, question, now));
}

/** Saves what the editor holds. Null when the question is gone. */
export function saveQuestion(question: TopicQuestion, now: number = Date.now()): Promise<TopicQuestion | null> {
  return queueWrite((database) => saveEditedQuestion(database, question, now));
}

/** Deletes a question and returns it whole, so Undo can put it back. */
export function removeQuestion(questionId: string, now: number = Date.now()): Promise<TopicQuestion | null> {
  return queueWrite((database) => deleteQuestion(database, questionId, now));
}

/** Undo: the question comes back with the same id, in the place it had. */
export function undoRemoveQuestion(question: TopicQuestion, now: number = Date.now()): Promise<void> {
  return queueWrite((database) => restoreQuestion(database, question, now));
}

export function moveQuestion(questionId: string, direction: -1 | 1, now: number = Date.now()): Promise<boolean> {
  return queueWrite((database) => moveQuestionWithinSection(database, questionId, direction, now));
}

/** Deletes a question (a blank one swept away, or one deleted from its editor), then tells the lists to re-read. */
export async function deleteQuestionAndRefreshLists(questionId: string): Promise<void> {
  await removeQuestion(questionId);
  announceTopicsChanged();
}
