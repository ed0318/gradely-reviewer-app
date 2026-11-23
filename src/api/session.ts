import { saveToken } from './tokens';

/**
 * Tells the app the session is over: the server refused the token, or the user
 * signed out or deleted the account. AccountProvider listens and goes to sign-in.
 */
export type SessionEndReason = 'refused' | 'signed_out' | 'account_deleted';
type SessionEndListener = (reason: SessionEndReason) => void;

const listeners = new Set<SessionEndListener>();

/** Returns the unsubscribe, for a `useEffect` cleanup. */
export function subscribeToSessionEnd(listener: SessionEndListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function endSession(reason: SessionEndReason): Promise<void> {
  await saveToken(null);
  for (const listener of listeners) listener(reason);
}
