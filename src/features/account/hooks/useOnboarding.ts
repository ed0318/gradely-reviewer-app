import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAccount, useSignedInSession } from '@/state/AccountProvider';
import { useBackThroughSteps } from '@/state/useBackThroughSteps';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { signOutOfAccount } from '../actions';
import { describeAccountError } from '../describeAccountError';
import { finishOnboarding } from '../onboarding';
import { deletePhotoFile, pickProfilePhoto, PhotoPermissionError, resolvePhotoUri, type PhotoSource } from '../profilePhoto';

/** Who · Alerts · First topic, as gradely-app's Who · Level · Year · Backup · First class. */
export const ONBOARDING_STEP_COUNT = 3;
export const DEFAULT_ALERT_CREDITS = '10';

export function useOnboarding() {
  const { account } = useSignedInSession();
  const { applyServerAccount } = useAccount();
  const isMountedRef = useIsMountedRef();
  const [step, setStep] = useState(1);
  // Google, or Apple on a first sign-in, may already have given a name: start from it, still editable.
  const [firstName, setFirstName] = useState(account.firstName);
  const [lastName, setLastName] = useState(account.lastName);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [isAlertOn, setIsAlertOn] = useState(true);
  const [alertCreditsText, setAlertCreditsText] = useState(DEFAULT_ALERT_CREDITS);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicSubject, setTopicSubject] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The photo is a real file from the moment it is picked; until setup finishes nothing points at it.
  const photoPathRef = useRef<string | null>(null);
  const isPhotoKeptRef = useRef(false);
  useEffect(
    () => () => {
      if (!isPhotoKeptRef.current) deletePhotoFile(photoPathRef.current);
    },
    [],
  );

  const stepBack = useCallback(() => setStep((current) => Math.max(1, current - 1)), []);
  useBackThroughSteps(step > 1, stepBack);

  const canContinue = step !== 1 || (firstName.trim().length > 0 && lastName.trim().length > 0);

  const choosePhoto = async (source: PhotoSource) => {
    try {
      const picked = await pickProfilePhoto(source);
      if (!picked) return;
      deletePhotoFile(photoPathRef.current);
      photoPathRef.current = picked;
      if (isMountedRef.current) setPhotoPath(picked);
    } catch (error) {
      Alert.alert('Profile picture', error instanceof PhotoPermissionError ? error.message : 'That photo could not be saved. Try another one.');
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
          deletePhotoFile(photoPathRef.current);
          photoPathRef.current = null;
          setPhotoPath(null);
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile picture', undefined, buttons);
  };

  const finish = async (options: { skipTopic?: boolean } = {}) => {
    setIsFinishing(true);
    setErrorMessage(null);
    try {
      const credits = Number.parseInt(alertCreditsText, 10);
      const user = await finishOnboarding({
        firstName,
        lastName,
        photoPath,
        isLowCreditAlertOn: isAlertOn,
        lowCreditThresholdCredits: Number.isFinite(credits) && credits >= 0 ? credits : Number(DEFAULT_ALERT_CREDITS),
        firstTopic: !options.skipTopic && topicTitle.trim() ? { title: topicTitle, subjectLabel: topicSubject } : null,
      });
      isPhotoKeptRef.current = true;
      // The named account ends onboarding; the navigator moves to Home.
      await applyServerAccount(user);
    } catch (error) {
      if (isMountedRef.current) setErrorMessage(describeAccountError(error, 'Finishing setup needs a connection to save your name. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsFinishing(false);
    }
  };

  /** Setup is not optional, so leaving it signs out; it asks first. */
  const cancelSetup = () =>
    Alert.alert('Leave setup?', 'You will be logged out, and what you have filled in here is not kept.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOutOfAccount() },
    ]);

  return {
    step,
    email: account.email,
    canContinue,
    goNext: () => {
      if (step < ONBOARDING_STEP_COUNT) setStep(step + 1);
      else void finish();
    },
    goBack: step > 1 ? stepBack : cancelSetup,
    skipTopic: () => void finish({ skipTopic: true }),
    firstName,
    setFirstName,
    lastName,
    setLastName,
    photoUri: resolvePhotoUri(photoPath),
    hasPhoto: photoPath !== null,
    openPhotoMenu,
    isAlertOn,
    toggleAlert: () => setIsAlertOn((isOn) => !isOn),
    alertCreditsText,
    setAlertCreditsText: (value: string) => setAlertCreditsText(value.replace(/\D/g, '').slice(0, 4)),
    topicTitle,
    setTopicTitle,
    topicSubject,
    setTopicSubject,
    isFinishing,
    errorMessage,
  };
}
