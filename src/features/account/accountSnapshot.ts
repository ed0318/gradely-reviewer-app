import * as SecureStore from 'expo-secure-store';

/**
 * Who the stored token belongs to, kept beside it in SecureStore. It lets a
 * launch with no connection decide whose phone this is without asking /me.
 */
export type AccountSnapshot = { id: string; email: string; firstName: string; lastName: string };

const SNAPSHOT_KEY = 'reviewer.account';

export async function readAccountSnapshot(): Promise<AccountSnapshot | null> {
  try {
    const stored = await SecureStore.getItemAsync(SNAPSHOT_KEY);
    return stored ? (JSON.parse(stored) as AccountSnapshot) : null;
  } catch (error) {
    console.warn('[reviewer] account snapshot unreadable', error);
    return null;
  }
}

export async function saveAccountSnapshot(snapshot: AccountSnapshot | null): Promise<void> {
  try {
    if (snapshot === null) await SecureStore.deleteItemAsync(SNAPSHOT_KEY);
    else await SecureStore.setItemAsync(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[reviewer] account snapshot not saved', error);
  }
}
