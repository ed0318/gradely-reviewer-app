import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isCancelledResponse, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';

/**
 * The native Google and Apple sign-in sheets. Each returns the provider's ID
 * token for reviewer-api to verify, or null when the person backed out. The
 * client ids are public identifiers; the server checks each token's audience.
 */
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** No web client id, no Google button: the server could not verify the token. */
export const isGoogleSignInConfigured = !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== 'ios' || !!GOOGLE_IOS_CLIENT_ID);

let isGoogleConfigured = false;

function configureGoogleOnce(): void {
  if (isGoogleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  isGoogleConfigured = true;
}

export async function requestGoogleIdToken(): Promise<string | null> {
  configureGoogleOnce();
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response) || !isSuccessResponse(response)) return null;
    if (!response.data.idToken) throw new Error('Google did not return an ID token. Check EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
    return response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error) && (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS)) return null;
    throw error;
  }
}

/** Google keeps its own session; ending it lets the next person pick a different account. */
export async function endGoogleSession(): Promise<void> {
  if (!isGoogleSignInConfigured) return;
  try {
    configureGoogleOnce();
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn('[reviewer] Google sign-out failed', error);
  }
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export type AppleCredential = { idToken: string; firstName: string | null; lastName: string | null };

export async function requestAppleCredential(): Promise<AppleCredential | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!credential.identityToken) throw new Error('Apple did not return an identity token.');
    // Apple gives the name only the first time; the server keeps it then.
    return { idToken: credential.identityToken, firstName: credential.fullName?.givenName ?? null, lastName: credential.fullName?.familyName ?? null };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}
