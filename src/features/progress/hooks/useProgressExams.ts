import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ProgressExam } from '@/db/repositories/progress';
import { useExamsChangeVersion } from '@/features/exams/examsChangeSignal';
import { loadProgressExams } from '../actions';

export type ProgressExamsState = { status: 'loading' | 'ready' | 'error'; exams: ProgressExam[] };

/**
 * Every exam with a finished attempt, most recently taken first. Re-read when the
 * tab comes into view and when an exam changes elsewhere (an attempt finished,
 * an exam deleted).
 */
export function useProgressExams(): ProgressExamsState & { retry: () => void } {
  const changeVersion = useExamsChangeVersion();
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<ProgressExamsState>({ status: 'loading', exams: [] });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgressExams()
        .then((exams) => {
          if (isActive) setState({ status: 'ready', exams });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] progress exams not read', error);
          if (isActive) setState((previous) => (previous.exams.length > 0 ? previous : { status: 'error', exams: [] }));
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` and `retryCount` are the triggers: a change elsewhere, and Try again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeVersion, retryCount]),
  );

  const retry = useCallback(() => {
    setState({ status: 'loading', exams: [] });
    setRetryCount((count) => count + 1);
  }, []);
  return { ...state, retry };
}
