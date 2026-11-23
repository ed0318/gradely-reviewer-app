import {
  deleteAccount as deleteAccountOnServer,
  register,
  signIn,
  signInWithApple,
  signInWithGoogle,
  signOut as signOutOnServer,
  updateName,
  type AccountUser,
  type Registration,
} from '@/api/auth';
import { queueWrite } from '@/db/client';
import type { Profile } from '@/db/records';
import { saveProfileName, saveProfilePhotoPath } from '@/db/repositories/account';
import { deletePhotoFile, pickProfilePhoto, type PhotoSource } from './profilePhoto';
import { eraseLocalDataAndPhotos, establishSession, type SessionState } from './session';
import { endGoogleSession, requestAppleCredential, requestGoogleIdToken } from './socialSignIn';

/** Each sign-in returns the new session and the server's account, or null when the person backed out. */
export type SignInResult = { session: SessionState; user: AccountUser };

async function finishSignIn(user: AccountUser): Promise<SignInResult> {
  return { session: await establishSession(user), user };
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  return finishSignIn(await signIn(email.trim(), password));
}

export async function createAccount(registration: Registration): Promise<SignInResult> {
  return finishSignIn(
    await register({
      email: registration.email.trim(),
      password: registration.password,
      firstName: registration.firstName.trim(),
      lastName: registration.lastName.trim(),
    }),
  );
}

export async function continueWithGoogle(): Promise<SignInResult | null> {
  const idToken = await requestGoogleIdToken();
  return idToken ? finishSignIn(await signInWithGoogle(idToken)) : null;
}

export async function continueWithApple(): Promise<SignInResult | null> {
  const credential = await requestAppleCredential();
  return credential ? finishSignIn(await signInWithApple(credential)) : null;
}

/** Signs out here even offline. The phone's topics stay; they still belong to this account. */
export async function signOutOfAccount(): Promise<void> {
  await endGoogleSession();
  await signOutOnServer();
}

/** The name lives on the server; the local profile follows once it has accepted it. */
export async function saveAccountName(firstName: string, lastName: string): Promise<AccountUser> {
  const user = await updateName(firstName.trim(), lastName.trim());
  await queueWrite((database) => saveProfileName(database, user.firstName, user.lastName));
  return user;
}

/** Picks, resizes and keeps a new photo, then drops the old file. Null when the person backed out. */
export async function changeProfilePhoto(profile: Profile, source: PhotoSource): Promise<Profile | null> {
  const photoPath = await pickProfilePhoto(source);
  if (!photoPath) return null;
  await queueWrite((database) => saveProfilePhotoPath(database, photoPath));
  deletePhotoFile(profile.photoPath);
  return { ...profile, photoPath };
}

export async function removeProfilePhoto(profile: Profile): Promise<Profile> {
  await queueWrite((database) => saveProfilePhotoPath(database, null));
  deletePhotoFile(profile.photoPath);
  return { ...profile, photoPath: null };
}

/**
 * Deletes the account on the server, then this phone's copy of it: the
 * topics and exams belong to an account that no longer exists.
 */
export async function deleteAccountAndLocalData(): Promise<void> {
  await deleteAccountOnServer();
  await endGoogleSession();
  await eraseLocalDataAndPhotos();
}
