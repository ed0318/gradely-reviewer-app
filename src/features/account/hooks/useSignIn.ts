import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { continueWithApple, continueWithGoogle, signInWithEmail, type SignInResult } from '../actions';
import { describeAccountError } from '../describeAccountError';
import { isAppleSignInAvailable, isGoogleSignInConfigured } from '../socialSignIn';

export type SignInMethod = 'email' | 'google' | 'apple';

/** The sign-in screen's state: the email form and the two provider buttons. */
export function useSignIn() {
  const { applySession } = useAccount();
  const isMountedRef = useIsMountedRef();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyMethod, setBusyMethod] = useState<SignInMethod | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const runSignIn = useCallback(
    async (method: SignInMethod, signInWork: () => Promise<SignInResult | null>) => {
      setBusyMethod(method);
      setErrorMessage(null);
      try {
        const result = await signInWork();
        // The navigator follows the new session; this screen goes away.
        if (result) applySession(result.session, result.user);
      } catch (error) {
        if (isMountedRef.current) setErrorMessage(describeAccountError(error, 'Signing in needs a connection. Connect and try again.'));
      } finally {
        if (isMountedRef.current) setBusyMethod(null);
      }
    },
    [applySession, isMountedRef],
  );

  const canSubmitEmail = email.trim().length > 0 && password.length > 0 && busyMethod === null;

  return {
    email,
    setEmail,
    password,
    setPassword,
    busyMethod,
    errorMessage,
    canSubmitEmail,
    isAppleAvailable,
    isGoogleAvailable: isGoogleSignInConfigured,
    submitEmail: () => {
      if (canSubmitEmail) void runSignIn('email', () => signInWithEmail(email, password));
    },
    signInWithGoogle: () => void runSignIn('google', continueWithGoogle),
    signInWithApple: () => void runSignIn('apple', continueWithApple),
  };
}
