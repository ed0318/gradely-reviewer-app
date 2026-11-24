import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { openDatabase } from '@/db/client';
import type { AttemptAnswer, AttemptQuestion, Exam, ExamAttempt } from '@/db/records';
import { findBestOtherFinishedAttempt, findPreviousFinishedAttempt, type AttemptScore } from '@/db/repositories/attempts';
import { countExamAttempts, getAttemptWithExam } from '@/db/repositories/exams';
import { markEssay, readAttemptContent } from '../attemptActions';
import { removeExam, savePendingRetake, type RetakeMode } from '../actions';
import { describeScoreChange, isBestSoFar } from '../formatExam';
import { buildResultItems, selectItemsToReview } from '../resultItems';
import { buildRetakeOptions } from '../retakeOptions';
import { scoreAttempt } from '../scoreAttempt';
import { useChargeFlow } from './useChargeFlow';

type Loaded = {
  attempt: ExamAttempt;
  exam: Exam;
  questions: AttemptQuestion[];
  answers: AttemptAnswer[];
  previous: AttemptScore | null;
  best: AttemptScore | null;
  attemptCount: number;
};

export type ResultsState = { status: 'loading' } | { status: 'error' } | { status: 'missing' } | ({ status: 'ready' } & Loaded);

/**
 * Everything the results screen shows and does: the score (counting essays as
 * they are marked), the change from last time, what to review, the two retakes
 * through the same charge flow as a new exam, and deleting the exam.
 */
export function useResults(attemptId: string) {
  const [state, setState] = useState<ResultsState>({ status: 'loading' });
  const [tries, setTries] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    let isActive = true;
    void (async () => {
      const database = await openDatabase();
      const found = await getAttemptWithExam(database, attemptId);
      if (!isActive) return;
      if (!found) return setState({ status: 'missing' });
      if (found.attempt.status !== 'finished') {
        // Not taken yet, or half taken: that is the take screen's job.
        router.replace({ pathname: '/exam/[id]/take', params: { id: attemptId } });
        return;
      }
      const { questions, answers } = await readAttemptContent(attemptId);
      const previous = await findPreviousFinishedAttempt(database, found.exam.id, found.attempt.attemptNumber);
      const best = await findBestOtherFinishedAttempt(database, found.exam.id, attemptId);
      const attemptCount = await countExamAttempts(database, found.exam.id);
      if (isActive) setState({ status: 'ready', ...found, questions, answers, previous, best, attemptCount });
    })().catch((error: unknown) => {
      console.warn('[reviewer] results not read', error);
      if (isActive) setState({ status: 'error' });
    });
    return () => {
      isActive = false;
    };
  }, [attemptId, tries]);

  const flow = useChargeFlow(
    useCallback((newAttemptId: string) => router.replace({ pathname: '/exam/[id]/take', params: { id: newAttemptId } }), []),
  );
  const { begin } = flow;

  const ready = state.status === 'ready' ? state : null;
  const items = useMemo(() => (ready ? buildResultItems(ready.questions, ready.answers) : []), [ready]);
  const summary = useMemo(() => (ready ? scoreAttempt(ready.questions, ready.answers) : null), [ready]);
  const retakeOptions = useMemo(() => (ready ? buildRetakeOptions(ready.questions, ready.answers) : null), [ready]);
  const toReview = useMemo(() => selectItemsToReview(items), [items]);

  const markEssayRight = useCallback(
    (questionId: string, isCorrect: boolean) => {
      if (!ready) return;
      // Shown at once; the score is saved behind it.
      setState({ ...ready, answers: ready.answers.map((answer) => (answer.attemptQuestionId === questionId ? { ...answer, isCorrect } : answer)) });
      void markEssay(attemptId, ready.questions, ready.answers, questionId, isCorrect).catch((error: unknown) => console.warn('[reviewer] essay mark not saved', error));
    },
    [attemptId, ready],
  );

  const retake = useCallback((mode: RetakeMode) => void begin(() => savePendingRetake({ sourceAttemptId: attemptId, mode })), [attemptId, begin]);

  const deleteExam = useCallback(() => {
    if (!ready) return;
    setIsDeleteOpen(false);
    router.replace('/(tabs)');
    void removeExam(ready.exam.id).catch((error: unknown) => console.warn('[reviewer] exam not deleted', error));
  }, [ready]);

  const current = summary ? { score: summary.score, totalPoints: summary.totalPoints } : null;
  return {
    state,
    retry: () => {
      setState({ status: 'loading' });
      setTries((count) => count + 1);
    },
    summary,
    items: showAll ? items : toReview,
    reviewCount: toReview.length,
    totalCount: items.length,
    showAll,
    toggleShowAll: () => setShowAll((value) => !value),
    changeText: ready && current ? describeScoreChange(ready.previous, current) : null,
    isBest: ready && current ? isBestSoFar(ready.best, current) : false,
    retakeOptions,
    retake,
    markEssay: markEssayRight,
    flow,
    isDeleteOpen,
    setIsDeleteOpen,
    deleteExam,
  };
}
