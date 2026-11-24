import { useCallback, useEffect, useRef, useState } from 'react';
import type { TopicQuestion } from '@/db/records';
import type { NumberedQuestion } from '@/db/repositories/questionList';
import { removeQuestion, undoRemoveQuestion } from '../actions';

/** How long "Question N deleted · Undo" stays up. */
export const UNDO_WINDOW_MS = 5000;

type Deleted = NumberedQuestion;

type Options = {
  onRemoved: (question: TopicQuestion) => void;
  onRestored: (restored: NumberedQuestion) => void;
};

/**
 * Swipe-to-delete with Undo. The question is deleted at once, and the toast
 * offers to put it back for five seconds; after that it is gone for good. A
 * second delete replaces the toast (the first can no longer be undone). The
 * timer is cleared when the screen goes.
 */
export function useQuestionDeletion({ onRemoved, onRestored }: Options) {
  const [deleted, setDeleted] = useState<Deleted | null>(null);
  const deletedRef = useRef<Deleted | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const dismissToast = useCallback(() => {
    clearTimer();
    deletedRef.current = null;
    setDeleted(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (next: Deleted) => {
      clearTimer();
      deletedRef.current = next;
      setDeleted(next);
      timerRef.current = setTimeout(dismissToast, UNDO_WINDOW_MS);
    },
    [clearTimer, dismissToast],
  );

  const deleteWithUndo = useCallback(
    async (question: TopicQuestion, number: number) => {
      try {
        const removed = await removeQuestion(question.id);
        if (!removed) return;
        onRemoved(removed);
        showToast({ question: removed, number });
      } catch (error) {
        console.warn('[reviewer] question not deleted', error);
      }
    },
    [onRemoved, showToast],
  );

  const undoDelete = useCallback(async () => {
    const current = deletedRef.current;
    if (!current) return;
    dismissToast();
    try {
      await undoRemoveQuestion(current.question);
      onRestored(current);
    } catch (error) {
      console.warn('[reviewer] question not restored', error);
    }
  }, [onRestored, dismissToast]);

  return { deleted, deleteWithUndo, undoDelete };
}
