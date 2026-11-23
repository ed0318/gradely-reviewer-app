import { refreshTokenOnce, requestResult, type RefreshOutcome } from './client';
import { isOfflineError } from './errors';
import { endSession } from './session';
import { saveToken } from './tokens';

/** The account as the server describes it. Credits are integer units (1 credit = 4 units). */
export type AccountUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
  balanceUnits: number;
};

type UserPayload = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  has_password: boolean;
  has_google: boolean;
  has_apple: boolean;
  balance_units: number;
};

type SessionPayload = { token: string; token_type: 'bearer'; expires_in: number; user: UserPayload };

export function toAccountUser(payload: UserPayload): AccountUser {
  return {
    id: payload.id,
    email: payload.email,
    firstName: payload.first_name,
    lastName: payload.last_name,
    isEmailVerified: payload.is_email_verified,
    hasPassword: payload.has_password,
    hasGoogle: payload.has_google,
    hasApple: payload.has_apple,
    balanceUnits: payload.balance_units,
  };
}

/** Keeps the new token and returns who signed in. */
async function startSession(path: string, body: Record<string, unknown>): Promise<AccountUser> {
  const session = await requestResult<SessionPayload>(path, { method: 'POST', body, isPublic: true });
  await saveToken(session.token);
  return toAccountUser(session.user);
}

/** Email and password only; the name is set afterwards by onboarding (`updateName`). */
export type Registration = { email: string; password: string };

export function register(registration: Registration): Promise<AccountUser> {
  return startSession('/auth/register', { email: registration.email, password: registration.password });
}

export function signIn(email: string, password: string): Promise<AccountUser> {
  return startSession('/auth/login', { email, password });
}

/** Sends the ID token from the native Google sign-in; the server verifies it. */
export function signInWithGoogle(idToken: string): Promise<AccountUser> {
  return startSession('/auth/social/google', { id_token: idToken });
}

export type AppleSignIn = {
  idToken: string;
  /** Apple gives the name only on the first sign-in, so it is passed along when present. */
  firstName?: string | null;
  lastName?: string | null;
};

export function signInWithApple(appleSignIn: AppleSignIn): Promise<AccountUser> {
  return startSession('/auth/social/apple', {
    id_token: appleSignIn.idToken,
    first_name: appleSignIn.firstName ?? null,
    last_name: appleSignIn.lastName ?? null,
  });
}

/** Renews the token ahead of time, e.g. when the app comes back to the foreground. */
export function refreshSession(): Promise<RefreshOutcome> {
  return refreshTokenOnce();
}

/**
 * Signs out here whatever the server says: the token is dropped even offline,
 * and the server's logout is only a courtesy to invalidate it early.
 */
export async function signOut(): Promise<void> {
  try {
    await requestResult('/auth/logout', { method: 'POST' });
  } catch (error) {
    if (!isOfflineError(error)) console.warn('[reviewer] logout failed', error);
  }
  await endSession('signed_out');
}

export async function requestPasswordReset(email: string): Promise<void> {
  await requestResult('/auth/password/forgot', { method: 'POST', body: { email }, isPublic: true });
}

export type PasswordReset = { email: string; code: string; password: string };

export async function resetPassword(passwordReset: PasswordReset): Promise<void> {
  await requestResult('/auth/password/reset', { method: 'POST', body: passwordReset, isPublic: true });
}

export async function fetchMe(signal?: AbortSignal): Promise<AccountUser> {
  return toAccountUser(await requestResult<UserPayload>('/me', { signal }));
}

export async function updateName(firstName: string, lastName: string): Promise<AccountUser> {
  return toAccountUser(await requestResult<UserPayload>('/me', { method: 'PATCH', body: { first_name: firstName, last_name: lastName } }));
}

/**
 * Deletes the account on the server. The session here is ended by the caller
 * (`endSession('account_deleted')`) once the person has seen it worked, as in gradely-app.
 */
export async function deleteAccount(): Promise<void> {
  await requestResult('/me', { method: 'DELETE' });
}
