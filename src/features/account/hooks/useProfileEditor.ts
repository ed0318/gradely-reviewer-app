import { useState } from 'react';
import { Alert } from 'react-native';
import { useAccount, useSignedInSession } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { changeProfilePhoto, removeProfilePhoto, saveAccountName } from '../actions';
import { describeAccountError } from '../describeAccountError';
import { PhotoPermissionError, resolvePhotoUri, type PhotoSource } from '../profilePhoto';

/** Settings' profile card: the photo (kept on the phone) and the name (saved to the server). */
export function useProfileEditor() {
  const { profile } = useSignedInSession();
  const { applyServerAccount, applyProfile } = useAccount();
  const isMountedRef = useIsMountedRef();
  // Unsaved edits; null shows the saved name, so a name that arrives from the server appears unless mid-edit.
  const [draftFirstName, setDraftFirstName] = useState<string | null>(null);
  const [draftLastName, setDraftLastName] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ tone: 'error' | 'saved'; text: string } | null>(null);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const firstName = draftFirstName ?? profile.firstName;
  const lastName = draftLastName ?? profile.lastName;

  const hasNameChanged = firstName.trim() !== profile.firstName || lastName.trim() !== profile.lastName;
  const canSaveName = hasNameChanged && firstName.trim().length > 0 && lastName.trim().length > 0 && !isSavingName;

  const saveName = async () => {
    if (!canSaveName) return;
    setIsSavingName(true);
    setNameMessage(null);
    try {
      const user = await saveAccountName(firstName, lastName);
      await applyServerAccount(user);
      if (isMountedRef.current) {
        setDraftFirstName(null);
        setDraftLastName(null);
        setNameMessage({ tone: 'saved', text: 'Name saved.' });
      }
    } catch (error) {
      const text = describeAccountError(error, 'Saving your name needs a connection. Connect and try again.');
      if (isMountedRef.current && text) setNameMessage({ tone: 'error', text });
    } finally {
      if (isMountedRef.current) setIsSavingName(false);
    }
  };

  const runPhotoChange = async (change: () => Promise<typeof profile | null>) => {
    setIsPhotoBusy(true);
    try {
      const nextProfile = await change();
      if (nextProfile) applyProfile(nextProfile);
    } catch (error) {
      const message = error instanceof PhotoPermissionError ? error.message : 'That photo could not be saved. Try another one.';
      if (!(error instanceof PhotoPermissionError)) console.warn('[reviewer] photo change failed', error);
      Alert.alert('Profile photo', message);
    } finally {
      if (isMountedRef.current) setIsPhotoBusy(false);
    }
  };

  const choosePhotoSource = () => {
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: 'Take a photo', onPress: () => void runPhotoChange(() => changeProfilePhoto(profile, 'camera' satisfies PhotoSource)) },
      { text: 'Choose from gallery', onPress: () => void runPhotoChange(() => changeProfilePhoto(profile, 'library')) },
    ];
    if (profile.photoPath) buttons.push({ text: 'Remove photo', style: 'destructive', onPress: () => void runPhotoChange(() => removeProfilePhoto(profile)) });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Saved on this phone only.', buttons);
  };

  return {
    email: profile.email,
    photoUri: resolvePhotoUri(profile.photoPath),
    firstName,
    lastName,
    setFirstName: (value: string) => {
      setNameMessage(null);
      setDraftFirstName(value);
    },
    setLastName: (value: string) => {
      setNameMessage(null);
      setDraftLastName(value);
    },
    canSaveName,
    isSavingName,
    nameMessage,
    saveName: () => void saveName(),
    isPhotoBusy,
    choosePhotoSource,
  };
}
