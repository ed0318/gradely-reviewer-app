import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import { findUpNextAttempt, type UpNextAttempt } from '@/db/repositories/attempts';
import { useExamsChangeVersion } from '@/features/exams/examsChangeSignal';

/** The attempt Home offers next (in progress, ready, or the soonest scheduled), re-read when Home comes into view or an exam changes. */
export function useUpNext(): UpNextAttempt | null {
  const changeVersion = useExamsChangeVersion();
  const [upNext, setUpNext] = useState<UpNextAttempt | null>(null);
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void openDatabase()
        .then(findUpNextAttempt)
        .then((next) => {
          if (isActive) setUpNext(next);
        })
        .catch((error: unknown) => console.warn('[reviewer] up next not read', error));
      return () => {
        isActive = false;
      };
      // `changeVersion` is the trigger: an exam changed elsewhere.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeVersion]),
  );
  return upNext;
}
