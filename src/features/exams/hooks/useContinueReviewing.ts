import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import { listReviewedExamsPage, type ReviewedExam } from '@/db/repositories/exams';
import { useExamsChangeVersion } from '../examsChangeSignal';

export type ContinueReviewingState = { status: 'loading' | 'ready' | 'error'; exams: ReviewedExam[] };

/** The few exams taken most recently, with best score and attempt count. Re-read when Home comes into view or an exam changes. */
export function useContinueReviewing(limit: number): ContinueReviewingState {
  const changeVersion = useExamsChangeVersion();
  const [state, setState] = useState<ContinueReviewingState>({ status: 'loading', exams: [] });
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void openDatabase()
        .then((database) => listReviewedExamsPage(database, { limit, offset: 0 }))
        .then((exams) => {
          if (isActive) setState({ status: 'ready', exams });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] reviewed exams not read', error);
          if (isActive) setState((previous) => ({ ...previous, status: previous.exams.length > 0 ? previous.status : 'error' }));
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` is the trigger: an exam changed elsewhere.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, changeVersion]),
  );
  return state;
}
