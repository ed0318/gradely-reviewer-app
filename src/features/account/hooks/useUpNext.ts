import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import { findNextScheduledAttempt, type UpNextAttempt } from '@/db/repositories/attempts';

/** The soonest scheduled exam, re-read whenever Home comes into view. */
export function useUpNext(): UpNextAttempt | null {
  const [upNext, setUpNext] = useState<UpNextAttempt | null>(null);
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void openDatabase()
        .then(findNextScheduledAttempt)
        .then((next) => {
          if (isActive) setUpNext(next);
        })
        .catch((error: unknown) => console.warn('[reviewer] up next not read', error));
      return () => {
        isActive = false;
      };
    }, []),
  );
  return upNext;
}
