import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, type AccountUser } from '@/api/auth';
import { isOfflineError, isRequestCancelled } from '@/api/errors';
import { subscribeToSessionEnd } from '@/api/session';
import type { Profile } from '@/db/records';
import { saveAccountSnapshot } from '@/features/account/accountSnapshot';
import { needsOnboarding, restoreSession, syncAccountFromServer, type SessionState } from '@/features/account/session';
import { useCredits } from './CreditsProvider';

/**
 * Who is signed in and whose phone this is. Holds the state only; the steps
 * that change it live in src/features/account (session.ts, actions, hooks).
 */
export type AccountSessionState = { kind: 'loading' } | SessionState;

type OwnerSession = Extract<SessionState, { kind: 'signed_in' | 'onboarding' }>;

/** Signed in on their own phone, whether or not onboarding is done. */
export function isOwnerSession(session: AccountSessionState): session is OwnerSession {
  return session.kind === 'signed_in' || session.kind === 'onboarding';
}

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
      if (nextServerAccount && isOwnerSession(next)) applyServerBalance(nextServerAccount.balanceUnits);
    },
    [applyServerBalance],
  );

  const applyServerAccount = useCallback(
    async (user: AccountUser) => {
      setServerAccount(user);
      applyServerBalance(user.balanceUnits);
      const current = isOwnerSession(session) ? session : null;
      if (!current || current.account.id !== user.id) return;
      const profile = await syncAccountFromServer(user, current.profile);
      // A name arriving from the server (onboarding, or set on another phone) finishes onboarding.
      setSession((latest) =>
        isOwnerSession(latest) && latest.account.id === user.id
          ? { kind: needsOnboarding(user) ? 'onboarding' : 'signed_in', account: { ...latest.account, ...user }, profile }
          : latest,
      );
    },
    [applyServerBalance, session],
  );

  const applyProfile = useCallback((profile: Profile) => {
    setSession((latest) => (isOwnerSession(latest) ? { ...latest, profile } : latest));
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
  const signedInAccountId = isOwnerSession(session) ? session.account.id : null;
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

/** The owner's session (signed in, or onboarding), for screens that only render then. */
export function useSignedInSession(): OwnerSession {
  const { session } = useAccount();
  if (!isOwnerSession(session)) throw new Error('This screen needs a signed-in session.');
  return session;
}
