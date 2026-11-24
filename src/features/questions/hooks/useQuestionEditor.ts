import { useCallback, useEffect, useRef, useState } from 'react';
import { openDatabase } from '@/db/client';
import type { TopicQuestion } from '@/db/records';
import { getQuestionPlace, type QuestionPlace } from '@/db/repositories/questionOrder';
import { getQuestion } from '@/db/repositories/questions';
import { createId } from '@/lib/ids';
import { useDebouncedSave } from '@/state/useDebouncedSave';
import { deleteQuestionAndRefreshLists, moveQuestion, saveQuestion } from '../actions';
import { applyDraftChange, type DraftChange } from '../questionDraft';
import { isUntouchedQuestion } from '../questionRules';

type Loaded = { status: 'loading' | 'missing' | 'error' } | { status: 'ready' };

/**
 * The question screen's copy of one question: read once, changed here, and
 * written a moment after typing pauses. Its number and place in its section
 * are read from the database, so a Move or a change of type shows once it has
 * landed. Leaving the screen writes what is waiting, and sweeps away a question
 * nobody typed into.
 */
export function useQuestionEditor(questionId: string) {
  const [question, setQuestion] = useState<TopicQuestion | null>(null);
  const [place, setPlace] = useState<QuestionPlace | null>(null);
  const [load, setLoad] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const questionRef = useRef<TopicQuestion | null>(null);
  const saver = useDebouncedSave(saveQuestion);
  const { schedule, flush } = saver;

  useEffect(() => {
    let isActive = true;
    void openDatabase()
      .then(async (database) => ({ found: await getQuestion(database, questionId), foundPlace: await getQuestionPlace(database, questionId) }))
      .then(({ found, foundPlace }) => {
        if (!isActive) return;
        questionRef.current = found;
        setQuestion(found);
        setPlace(foundPlace);
        setLoad({ status: found ? 'ready' : 'missing' });
      })
      .catch((error: unknown) => {
        console.warn('[reviewer] question not opened', error);
        if (isActive) setLoad({ status: 'error' });
      });
    return () => {
      isActive = false;
    };
  }, [questionId, attempt]);

  // Declared after the saver, so on leaving its flush is queued before this delete.
  useEffect(
    () => () => {
      const current = questionRef.current;
      if (current && isUntouchedQuestion(current)) void deleteQuestionAndRefreshLists(current.id).catch((error: unknown) => console.warn('[reviewer] blank question kept', error));
    },
    [],
  );

  const refreshPlace = useCallback(async () => {
    try {
      const next = await getQuestionPlace(await openDatabase(), questionId);
      setPlace((previous) => next ?? previous);
    } catch (error) {
      console.warn('[reviewer] place not read', error);
    }
  }, [questionId]);

  const change = useCallback(
    (draftChange: DraftChange) => {
      const previous = questionRef.current;
      if (!previous) return;
      const next = applyDraftChange(previous, draftChange, createId);
      if (next === previous) return;
      questionRef.current = next;
      setQuestion(next);
      schedule(next);
      // A new type moves the question to another section: write now, then show where it landed.
      if (draftChange.kind === 'type') void flush().then(refreshPlace);
    },
    [schedule, flush, refreshPlace],
  );

  /** Moves once whatever was typed has landed, so the move reads the question as it now is. */
  const move = useCallback(
    async (direction: -1 | 1) => {
      await flush();
      try {
        if (await moveQuestion(questionId, direction)) await refreshPlace();
      } catch (error) {
        console.warn('[reviewer] question not moved', error);
      }
    },
    [questionId, flush, refreshPlace],
  );

  /** Deletes this question once whatever was typed has landed. The screen is left by the caller. */
  const deleteThisQuestion = useCallback(async () => {
    await flush();
    await deleteQuestionAndRefreshLists(questionId);
  }, [questionId, flush]);

  const retry = useCallback(() => {
    setLoad({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  return { question, place, loadStatus: load.status, saveStatus: saver.status, change, move, flush, deleteThisQuestion, retry };
}
