import { fetchMe, type AccountUser } from '@/api/auth';
import { readToken } from '@/api/tokens';
import { openDatabase, queueWrite } from '@/db/client';
import type { Profile } from '@/db/records';
import { getProfile, saveBalanceCache, saveProfile } from '@/db/repositories/account';
import { eraseAllLocalData, hasLocalData, summarizeLocalData, type LocalDataSummary } from '@/db/repositories/localData';
import { readAccountSnapshot, saveAccountSnapshot, type AccountSnapshot } from './accountSnapshot';
import { decidePhoneOwner } from './phoneOwner';
import { deleteAllPhotoFiles } from './profilePhoto';

/**
 * Where the app stands with the account, and the steps that move it. The
 * AccountProvider holds the state; these functions do the work (token,
 * SecureStore snapshot, SQLite profile) and return the next state.
 */
export type SessionState =
  | { kind: 'signed_out' }
  | { kind: 'signed_in'; account: AccountSnapshot; profile: Profile }
  | { kind: 'handover'; account: AccountSnapshot; owner: PhoneOwner };

/** The person whose topics are on this phone, for the hand-over screen. */
export type PhoneOwner = { accountId: string; firstName: string; lastName: string; summary: LocalDataSummary };

export function toAccountSnapshot(user: AccountUser | AccountSnapshot): AccountSnapshot {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

/** At launch: no network needed when the token's account is already known. */
export async function restoreSession(): Promise<SessionState> {
  const token = await readToken();
  if (!token) return { kind: 'signed_out' };

  const snapshot = await readAccountSnapshot();
  if (snapshot) return settlePhoneOwner(snapshot);

  // A token with no snapshot: only /me can say whose it is.
  try {
    return await establishSession(await fetchMe());
  } catch {
    return { kind: 'signed_out' };
  }
}

/** After any sign-in: keep who it is, then decide whose phone this is. */
export async function establishSession(user: AccountUser): Promise<SessionState> {
  const snapshot = toAccountSnapshot(user);
  await saveAccountSnapshot(snapshot);
  const state = await settlePhoneOwner(snapshot);
  if (state.kind === 'signed_in') await queueWrite((database) => saveBalanceCache(database, user.balanceUnits, Date.now()));
  return state;
}

async function settlePhoneOwner(account: AccountSnapshot): Promise<SessionState> {
  const database = await openDatabase();
  const [localProfile, summary] = await Promise.all([getProfile(database), summarizeLocalData(database)]);
  const decision = decidePhoneOwner({
    signedInAccountId: account.id,
    localOwnerAccountId: localProfile?.accountId ?? null,
    hasLocalData: hasLocalData(summary),
  });

  if (decision.kind === 'handover' && localProfile) {
    return {
      kind: 'handover',
      account,
      owner: { accountId: localProfile.accountId, firstName: localProfile.firstName, lastName: localProfile.lastName, summary },
    };
  }

  // The same person keeps their photo; a new owner of an empty phone starts clean.
  const isSameOwner = localProfile?.accountId === account.id;
  if (localProfile && !isSameOwner) await eraseLocalDataAndPhotos();
  const profile: Profile = {
    accountId: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    photoPath: isSameOwner ? localProfile.photoPath : null,
  };
  await queueWrite((writer) => saveProfile(writer, profile));
  return { kind: 'signed_in', account, profile };
}

/** The hand-over's last step: the owner's data goes, and the signed-in account takes the phone. */
export async function completeHandover(account: AccountSnapshot): Promise<SessionState> {
  await eraseLocalDataAndPhotos();
  return settlePhoneOwner(account);
}

export async function eraseLocalDataAndPhotos(): Promise<void> {
  await queueWrite(eraseAllLocalData);
  deleteAllPhotoFiles();
}

/** The server's latest copy of the account: names into the profile and snapshot, balance into the cache. */
export async function syncAccountFromServer(user: AccountUser, profile: Profile): Promise<Profile> {
  const nextProfile = { ...profile, email: user.email, firstName: user.firstName, lastName: user.lastName };
  await saveAccountSnapshot(toAccountSnapshot(user));
  await queueWrite(async (database) => {
    await saveProfile(database, nextProfile);
    await saveBalanceCache(database, user.balanceUnits, Date.now());
  });
  return nextProfile;
}
