import { useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/api/auth';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { describeAccountError } from '../describeAccountError';
import { looksLikeEmail, meetsPasswordRules } from '../passwordRules';

export const RESET_CODE_LENGTH = 6;

/** Forgot password: asks for the address and mails a code. The server answers the same whether or not it has an account. */
export function useForgotPassword(initialEmail: string | undefined, onCodeSent: (email: string) => void) {
  const isMountedRef = useIsMountedRef();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSend = !isBusy && looksLikeEmail(email);

  const send = async () => {
    if (!canSend) return;
    const address = email.trim();
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await requestPasswordReset(address);
      onCodeSent(address);
    } catch (error) {
      if (isMountedRef.current) setErrorMessage(describeAccountError(error, 'Sending a code needs a connection. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  return {
    email,
    setEmail: (value: string) => {
      setErrorMessage(null);
      setEmail(value);
    },
    isBusy,
    errorMessage,
    canSend,
    send: () => void send(),
  };
}

/** The code and the new password. Not signed in afterwards: the person signs in with it, as in gradely-app. */
export function useResetPassword(email: string, onPasswordChanged: () => void) {
  const isMountedRef = useIsMountedRef();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const canSubmit = !isBusy && code.length === RESET_CODE_LENGTH && meetsPasswordRules(password);

  const submit = async () => {
    if (!canSubmit) return;
    setIsBusy(true);
    setErrorMessage(null);
    setNote(null);
    try {
      await resetPassword({ email, code, password });
      onPasswordChanged();
    } catch (error) {
      if (!isMountedRef.current) return;
      // A rejected code is the usual failure; the password the person got right is kept.
      setCode('');
      setErrorMessage(describeAccountError(error, 'Changing your password needs a connection. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  const resend = async () => {
    setIsResending(true);
    setErrorMessage(null);
    try {
      await requestPasswordReset(email);
      if (isMountedRef.current) setNote(`Sent again to ${email}.`);
    } catch (error) {
      if (isMountedRef.current) setNote(describeAccountError(error, 'Sending a code needs a connection.'));
    } finally {
      if (isMountedRef.current) setIsResending(false);
    }
  };

  return {
    code,
    setCode: (value: string) => {
      setErrorMessage(null);
      setCode(value.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH));
    },
    password,
    setPassword: (value: string) => {
      setErrorMessage(null);
      setPassword(value);
    },
    isBusy,
    isResending,
    errorMessage,
    note,
    canSubmit,
    submit: () => void submit(),
    resend: () => void resend(),
  };
}
