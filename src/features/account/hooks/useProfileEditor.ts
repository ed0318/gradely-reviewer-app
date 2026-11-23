import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { afterModalDismiss, useConfirmDelete } from '@/components/ConfirmDeleteModal';
import { queueWrite } from '@/db/client';
import { saveProfilePhotoPath } from '@/db/repositories/account';
import { useAccount, useSignedInSession } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { deleteAccountOnServer, finishAccountDeletion, saveAccountName } from '../actions';
import { describeAccountError } from '../describeAccountError';
import { deletePhotoFile, pickProfilePhoto, PhotoPermissionError, resolvePhotoUri, type PhotoSource } from '../profilePhoto';

/**
 * gradely-app's profile screen: the picture and name are a draft until Save
 * changes. The name goes to the account first (it needs a connection); the
 * picture stays on this phone.
 */
export function useProfileEditor() {
  const { profile } = useSignedInSession();
  const { applyServerAccount, applyProfile } = useAccount();
  const isMountedRef = useIsMountedRef();
  const { confirmDelete, confirmModal } = useConfirmDelete();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [photoPath, setPhotoPath] = useState(profile.photoPath);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // A picture picked here and never saved is a file nothing points at; it goes when the screen does.
  const draftPhotoRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (draftPhotoRef.current) deletePhotoFile(draftPhotoRef.current);
    },
    [],
  );

  const isNameChanged = firstName.trim() !== profile.firstName || lastName.trim() !== profile.lastName;
  const isPhotoChanged = photoPath !== profile.photoPath;
  const isDirty = isNameChanged || isPhotoChanged;
  const canSave = isDirty && !isSaving && firstName.trim().length > 0 && lastName.trim().length > 0;

  const choosePhoto = async (source: PhotoSource) => {
    try {
      const picked = await pickProfilePhoto(source);
      if (!picked) return;
      if (draftPhotoRef.current) deletePhotoFile(draftPhotoRef.current);
      draftPhotoRef.current = picked;
      setPhotoPath(picked);
      setIsSaved(false);
    } catch (error) {
      if (error instanceof PhotoPermissionError) return Alert.alert('Profile picture', error.message);
      Alert.alert('That photo could not be saved', 'Try picking it again, or choose a different one.');
    }
  };

  const openPhotoMenu = () => {
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: 'Take a photo', onPress: () => void choosePhoto('camera') },
      { text: 'Choose from gallery', onPress: () => void choosePhoto('library') },
    ];
    if (photoPath) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => {
          setPhotoPath(null);
          setIsSaved(false);
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile picture', 'Saved on this phone only.', buttons);
  };

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      if (isNameChanged) await applyServerAccount(await saveAccountName(firstName, lastName));
      if (isPhotoChanged) {
        await queueWrite((database) => saveProfilePhotoPath(database, photoPath));
        // The picture being replaced is only deleted once the new one is in.
        if (profile.photoPath) deletePhotoFile(profile.photoPath);
        draftPhotoRef.current = null;
        applyProfile({ ...profile, firstName: firstName.trim(), lastName: lastName.trim(), photoPath });
      }
      if (isMountedRef.current) setIsSaved(true);
    } catch (error) {
      const message = describeAccountError(error, 'Connect to the internet and tap Save again. Nothing was changed yet.');
      if (message) Alert.alert('Your name was not changed', message);
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  };

  const confirmDeleteAccount = () =>
    confirmDelete({
      title: 'Delete your account?',
      cascadeHeading: 'WHAT GOES WITH IT',
      cascadeItems: [
        { label: 'Your account', detail: `${profile.email}: sign-in and name` },
        { label: 'Your credits', detail: 'Any credits left are lost, with their history.' },
        { label: 'Everything on this phone', detail: 'Your topics, questions, exams, scores and picture are erased too.' },
        { label: 'Signing up again won’t bring it back', detail: 'A new account is a different account. It starts empty.' },
      ],
      warning: 'This cannot be undone. Your account and everything on this phone are erased.',
      confirmLabel: 'Delete for good',
      confirmWord: 'DELETE',
      onConfirm: () => {
        setIsDeleting(true);
        void deleteAccountOnServer()
          .then(() => {
            if (isMountedRef.current) setIsDeleted(true);
          })
          .catch((error: unknown) => {
            const message = describeAccountError(error, 'Deleting your account needs a connection. Nothing was deleted.');
            if (message) Alert.alert('Could not delete your account', message);
          })
          .finally(() => {
            if (isMountedRef.current) setIsDeleting(false);
          });
      },
    });

  return {
    email: profile.email,
    photoUri: resolvePhotoUri(photoPath),
    hasPhoto: photoPath !== null,
    openPhotoMenu,
    firstName,
    lastName,
    setFirstName: (value: string) => {
      setIsSaved(false);
      setFirstName(value);
    },
    setLastName: (value: string) => {
      setIsSaved(false);
      setLastName(value);
    },
    isDirty,
    canSave,
    isSaving,
    isSaved,
    save: () => void save(),
    isDeleting,
    confirmDeleteAccount,
    confirmModal,
    isDeleted,
    /** Dismiss the notice first, then end the session, which swaps this screen for sign-in. */
    finishDeletion: () => {
      setIsDeleted(false);
      afterModalDismiss(() => void finishAccountDeletion());
    },
  };
}
