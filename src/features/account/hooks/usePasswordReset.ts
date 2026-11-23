import { useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/api/auth';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { describeAccountError } from '../describeAccountError';
import { MIN_PASSWORD_LENGTH } from './useCreateAccount';

export type PasswordResetStep = 'email' | 'code' | 'done';
export const RESET_CODE_LENGTH = 6;

/** Forgot password: the email gets a 6-digit code, which sets a new password. */
export function usePasswordReset() {
  const isMountedRef = useIsMountedRef();
  const [step, setStep] = useState<PasswordResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runStep = async (work: () => Promise<void>, nextStep: PasswordResetStep) => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await work();
      if (isMountedRef.current) setStep(nextStep);
    } catch (error) {
      if (isMountedRef.current) setErrorMessage(describeAccountError(error, 'This needs a connection. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  const canSendCode = !isBusy && email.trim().length > 0;
  const canReset = !isBusy && code.length === RESET_CODE_LENGTH && newPassword.length >= MIN_PASSWORD_LENGTH;

  return {
    step,
    email,
    setEmail,
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH)),
    newPassword,
    setNewPassword,
    isBusy,
    errorMessage,
    canSendCode,
    canReset,
    sendCode: () => {
      if (canSendCode) void runStep(() => requestPasswordReset(email.trim()), 'code');
    },
    resetWithCode: () => {
      if (canReset) void runStep(() => resetPassword({ email: email.trim(), code, password: newPassword }), 'done');
    },
  };
}
