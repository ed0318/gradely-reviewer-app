import { useState } from 'react';
import { isConfirmWordTyped } from '@/components/ConfirmWordField';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { deleteAccountAndLocalData, signOutOfAccount } from '../actions';
import { describeAccountError } from '../describeAccountError';

/** Sign out, and delete the account behind "Type DELETE to confirm". */
export function useAccountExit() {
  const isMountedRef = useIsMountedRef();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [typedWord, setTypedWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      // Signs out here even offline; the session listener then shows sign-in.
      await signOutOfAccount();
    } finally {
      if (isMountedRef.current) setIsSigningOut(false);
    }
  };

  const canDelete = isConfirmWordTyped('DELETE', typedWord) && !isDeleting;

  const deleteAccount = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccountAndLocalData();
    } catch (error) {
      if (isMountedRef.current) setDeleteError(describeAccountError(error, 'Deleting your account needs a connection. Nothing was deleted.'));
    } finally {
      if (isMountedRef.current) setIsDeleting(false);
    }
  };

  return {
    isSigningOut,
    signOut: () => void signOut(),
    typedWord,
    setTypedWord: (value: string) => {
      setDeleteError(null);
      setTypedWord(value);
    },
    canDelete,
    isDeleting,
    deleteError,
    deleteAccount: () => void deleteAccount(),
  };
}
