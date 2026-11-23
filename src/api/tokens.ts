import * as SecureStore from 'expo-secure-store';

/**
 * The account's bearer token, kept in SecureStore (keychain / Android
 * keystore), never AsyncStorage. Held in memory once read: every request needs
 * it, and it only changes through `saveToken`.
 */
const TOKEN_KEY = 'reviewer.token';

let heldToken: { token: string | null } | null = null;

export async function readToken(): Promise<string | null> {
  if (heldToken) return heldToken.token;
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    // An unreadable keystore means signed out, not a crash at launch.
    console.warn('[reviewer] secure store read failed', error);
  }
  // A `saveToken` that landed while the keystore was being read wins.
  if (!heldToken) heldToken = { token };
  return heldToken.token;
}

export async function saveToken(token: string | null): Promise<void> {
  heldToken = { token };
  try {
    if (token === null) await SecureStore.deleteItemAsync(TOKEN_KEY);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn('[reviewer] secure store write failed', error);
  }
}
