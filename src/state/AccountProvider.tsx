import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, type AccountUser } from '@/api/auth';
import { isOfflineError, isRequestCancelled } from '@/api/errors';
import { subscribeToSessionEnd } from '@/api/session';
import type { Profile } from '@/db/records';
import { saveAccountSnapshot } from '@/features/account/accountSnapshot';
import { restoreSession, syncAccountFromServer, type SessionState } from '@/features/account/session';
import { useCredits } from './CreditsProvider';

/**
 * Who is signed in and whose phone this is. Holds the state only; the steps
 * that change it live in src/features/account (session.ts, actions, hooks).
 */
export type AccountSessionState = { kind: 'loading' } | SessionState;

type AccountContextValue = {
  session: AccountSessionState;
  /** The server's latest copy (sign-in methods, verified email), once /me has answered. */
  serverAccount: AccountUser | null;
  applySession: (session: SessionState, serverAccount?: AccountUser | null) => void;
  applyServerAccount: (user: AccountUser) => Promise<void>;
  applyProfile: (profile: Profile) => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { applyServerBalance, clearBalance } = useCredits();
  const [session, setSession] = useState<AccountSessionState>({ kind: 'loading' });
  const [serverAccount, setServerAccount] = useState<AccountUser | null>(null);

  const applySession = useCallback(
    (next: SessionState, nextServerAccount: AccountUser | null = null) => {
      setSession(next);
      setServerAccount(nextServerAccount);
      if (nextServerAccount && next.kind === 'signed_in') applyServerBalance(nextServerAccount.balanceUnits);
    },
    [applyServerBalance],
  );

  const applyServerAccount = useCallback(
    async (user: AccountUser) => {
      setServerAccount(user);
      applyServerBalance(user.balanceUnits);
      const current = session.kind === 'signed_in' ? session : null;
      if (!current || current.account.id !== user.id) return;
      const profile = await syncAccountFromServer(user, current.profile);
      setSession((latest) => (latest.kind === 'signed_in' && latest.account.id === user.id ? { ...latest, account: { ...latest.account, ...user }, profile } : latest));
    },
    [applyServerBalance, session],
  );

  const applyProfile = useCallback((profile: Profile) => {
    setSession((latest) => (latest.kind === 'signed_in' ? { ...latest, profile } : latest));
  }, []);

  // Launch: read the stored session without waiting on the network.
  useEffect(() => {
    let isMounted = true;
    void restoreSession()
      .catch((error: unknown) => {
        console.warn('[reviewer] session not restored', error);
        return { kind: 'signed_out' } as const;
      })
      .then((restored) => {
        if (isMounted) setSession(restored);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Once signed in, refresh the account from the server in the background.
  const signedInAccountId = session.kind === 'signed_in' ? session.account.id : null;
  const isServerAccountLoaded = serverAccount?.id === signedInAccountId;
  useEffect(() => {
    if (!signedInAccountId || isServerAccountLoaded) return;
    const controller = new AbortController();
    fetchMe(controller.signal)
      .then((user) => applyServerAccount(user))
      .catch((error: unknown) => {
        if (!isRequestCancelled(error) && !isOfflineError(error)) console.warn('[reviewer] account refresh failed', error);
      });
    return () => controller.abort();
    // applyServerAccount changes with session; refreshing once per account is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInAccountId, isServerAccountLoaded]);

  // The server refused the token, or the person signed out: back to sign-in.
  useEffect(
    () =>
      subscribeToSessionEnd(() => {
        void saveAccountSnapshot(null);
        setServerAccount(null);
        clearBalance();
        setSession({ kind: 'signed_out' });
      }),
    [clearBalance],
  );

  const value = useMemo(
    () => ({ session, serverAccount, applySession, applyServerAccount, applyProfile }),
    [session, serverAccount, applySession, applyServerAccount, applyProfile],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider.');
  return value;
}

/** The signed-in session, for screens that only render once signed in. */
export function useSignedInSession() {
  const { session } = useAccount();
  if (session.kind !== 'signed_in') throw new Error('This screen needs a signed-in session.');
  return session;
}
