import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import { countChargingAttempts } from '@/db/repositories/attempts';
import { retryPendingCharges } from '../actions';
import { useExamsChangeVersion } from '../examsChangeSignal';
import { useCredits } from '@/state/CreditsProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';

/** How many exams are saved but not yet charged for (the phone was offline), and a way to try them now. */
export function usePendingCharges() {
  const changeVersion = useExamsChangeVersion();
  const { applyServerBalance } = useCredits();
  const isMountedRef = useIsMountedRef();
  const [count, setCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStillOffline, setIsStillOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void openDatabase()
        .then(countChargingAttempts)
        .then((total) => {
          if (isActive) setCount(total);
        })
        .catch((error: unknown) => console.warn('[reviewer] pending charges not counted', error));
      return () => {
        isActive = false;
      };
      // `changeVersion` is the trigger: a charge settled elsewhere.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeVersion]),
  );

  const retryNow = useCallback(async () => {
    setIsRetrying(true);
    setIsStillOffline(false);
    try {
      const outcomes = await retryPendingCharges({ onBalance: applyServerBalance });
      if (isMountedRef.current) setIsStillOffline(outcomes.some((outcome) => outcome.kind === 'offline' || outcome.kind === 'unavailable'));
      const total = await openDatabase().then(countChargingAttempts);
      if (isMountedRef.current) setCount(total);
    } catch (error) {
      console.warn('[reviewer] pending charges not retried', error);
    } finally {
      if (isMountedRef.current) setIsRetrying(false);
    }
  }, [applyServerBalance, isMountedRef]);

  return { count, isRetrying, isStillOffline, retryNow };
}
