import { useEffect, useMemo, useState } from 'react';
import { hasApiErrorCode } from '@/api/errors';
import { useAccount } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { continueWithApple, continueWithGoogle, createAccount, signInWithEmail, type SignInResult } from '../actions';
import type { AuthMode } from '../components/AuthModeTabs';
import { describeAccountError } from '../describeAccountError';
import { listPasswordRules, looksLikeEmail, meetsPasswordRules } from '../passwordRules';
import { isAppleSignInAvailable, isGoogleSignInConfigured } from '../socialSignIn';

export type SignInMethod = 'email' | 'google' | 'apple';
type AuthFormFields = { email: string; password: string; confirmation: string };
const EMPTY_FIELDS: AuthFormFields = { email: '', password: '', confirmation: '' };

/**
 * gradely-app's sign-in form: Log in and Create account on one screen, each
 * tab keeping its own fields, and the Apple and Google buttons under it.
 */
export function useAuthForm() {
  const { applySession } = useAccount();
  const isMountedRef = useIsMountedRef();
  const [mode, setMode] = useState<AuthMode>('login');
  // What was typed under Log in is somebody's existing account; it does not carry over to Create account.
  const [fieldsByMode, setFieldsByMode] = useState<Record<AuthMode, AuthFormFields>>({ login: EMPTY_FIELDS, signup: EMPTY_FIELDS });
  const [busyMethod, setBusyMethod] = useState<SignInMethod | null>(null);
  const [error, setError] = useState<{ message: string; existingEmail?: string } | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void isAppleSignInAvailable().then((isAvailable) => {
      if (isMounted) setIsAppleAvailable(isAvailable);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isSignup = mode === 'signup';
  const fields = fieldsByMode[mode];
  const setField = (patch: Partial<AuthFormFields>) => {
    setError(null);
    setFieldsByMode((all) => ({ ...all, [mode]: { ...all[mode], ...patch } }));
  };

  const passwordRules = useMemo(() => listPasswordRules(fields.password, fields.confirmation), [fields.password, fields.confirmation]);
  const canSubmit =
    busyMethod === null &&
    looksLikeEmail(fields.email) &&
    (isSignup ? meetsPasswordRules(fields.password, fields.confirmation) : fields.password.length > 0);

  const runSignIn = async (method: SignInMethod, signInWork: () => Promise<SignInResult | null>) => {
    setBusyMethod(method);
    setError(null);
    try {
      const result = await signInWork();
      if (!result) return;
      // Emptied once it has done its job: a password left in a field is readable by anyone who taps Show.
      if (isMountedRef.current) setFieldsByMode({ login: EMPTY_FIELDS, signup: EMPTY_FIELDS });
      // The navigator follows the new session; this screen goes away.
      applySession(result.session, result.user);
    } catch (error) {
      if (!isMountedRef.current) return;
      const message = describeAccountError(error, 'Signing in needs a connection. Connect and try again.');
      if (message) setError({ message, existingEmail: hasApiErrorCode(error, 'email_taken') ? fields.email.trim() : undefined });
    } finally {
      if (isMountedRef.current) setBusyMethod(null);
    }
  };

  return {
    mode,
    switchMode: (next: AuthMode) => {
      setError(null);
      setMode(next);
    },
    isSignup,
    fields,
    setEmail: (email: string) => setField({ email }),
    setPassword: (password: string) => setField({ password }),
    setConfirmation: (confirmation: string) => setField({ confirmation }),
    passwordRules,
    canSubmit,
    busyMethod,
    error,
    /** Create account said the email has an account: carry it to Log in, without the password. */
    logInWithExistingEmail: () => {
      if (!error?.existingEmail) return;
      setFieldsByMode((all) => ({ ...all, login: { ...EMPTY_FIELDS, email: error.existingEmail ?? '' } }));
      setError(null);
      setMode('login');
    },
    submit: () => {
      if (!canSubmit) return;
      const { email, password } = fields;
      void runSignIn('email', () => (isSignup ? createAccount({ email, password }) : signInWithEmail(email, password)));
    },
    isAppleAvailable,
    isGoogleAvailable: isGoogleSignInConfigured,
    signInWithGoogle: () => void runSignIn('google', continueWithGoogle),
    signInWithApple: () => void runSignIn('apple', continueWithApple),
    emailForReset: looksLikeEmail(fields.email) ? fields.email.trim() : undefined,
  };
}
