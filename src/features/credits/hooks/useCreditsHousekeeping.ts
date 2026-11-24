import { useEffect } from 'react';
import { AppState } from 'react-native';
import { checkPurchasesOnOpen, syncStoreAccount } from '../actions';
import { useSignedInSession } from '@/state/AccountProvider';
import { useCredits } from '@/state/CreditsProvider';

const FIRST_RUN_DELAY_MS = 1500;

/**
 * What credits need each time the app opens or comes back to the front, once
 * signed in: tell the store who is buying, then ask the server to credit any
 * purchase that was never confirmed (the app was killed mid-purchase) and
 * report the balance. The first run waits a moment so it never competes with
 * the first paint; the check runs at most once a minute.
 */
export function useCreditsHousekeeping(): void {
  const { account } = useSignedInSession();
  const { applyServerBalance } = useCredits();
  const accountId = account.id;

  useEffect(() => {
    let isActive = true;
    const run = () => {
      void syncStoreAccount(accountId)
        .then(() => (isActive ? checkPurchasesOnOpen(accountId, { onBalance: (units) => isActive && applyServerBalance(units) }) : undefined))
        .catch((error: unknown) => console.warn('[reviewer] credits housekeeping failed', error));
    };
    const firstRun = setTimeout(run, FIRST_RUN_DELAY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      isActive = false;
      clearTimeout(firstRun);
      subscription.remove();
    };
  }, [accountId, applyServerBalance]);
}
