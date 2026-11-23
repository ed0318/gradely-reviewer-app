import { Alert } from 'react-native';
import { signOutOfAccount } from '../actions';

/** Logging out asks first, as in gradely-app: one stray tap at the foot of a list should not end the session. */
export function useSignOut() {
  return () =>
    Alert.alert(
      'Log out?',
      'Your topics and exams stay on this phone, but you need to log in again to use them, and logging in needs an internet connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void signOutOfAccount() },
      ],
    );
}
