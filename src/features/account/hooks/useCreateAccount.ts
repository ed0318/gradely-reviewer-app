import { useState } from 'react';
import { useAccount } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { createAccount } from '../actions';
import { describeAccountError } from '../describeAccountError';

export const MIN_PASSWORD_LENGTH = 8;

export function useCreateAccount() {
  const { applySession } = useAccount();
  const isMountedRef = useIsMountedRef();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPasswordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    !isBusy && firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH;

  const submit = async () => {
    if (!canSubmit) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await createAccount({ firstName, lastName, email, password });
      applySession(result.session, result.user);
    } catch (error) {
      if (isMountedRef.current) setErrorMessage(describeAccountError(error, 'Creating an account needs a connection. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    isPasswordTooShort,
    isBusy,
    errorMessage,
    canSubmit,
    submit: () => void submit(),
  };
}
