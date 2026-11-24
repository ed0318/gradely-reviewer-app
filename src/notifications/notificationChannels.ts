import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/** Android groups notifications into channels the student can mute one by one. iOS ignores all of this. */
export const EXAM_REMINDER_CHANNEL = 'exam-reminders';
export const LOW_CREDIT_CHANNEL = 'low-credits';

let channelsReady: Promise<void> | null = null;

/**
 * Makes the channels, once per launch. Android 13 shows its permission prompt
 * only once a channel exists, so this runs before any permission request.
 */
export function setUpNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelsReady) {
    channelsReady = Promise.all([
      Notifications.setNotificationChannelAsync(EXAM_REMINDER_CHANNEL, {
        name: 'Exam reminders',
        description: 'Before an exam you scheduled starts.',
        importance: Notifications.AndroidImportance.HIGH,
      }),
      Notifications.setNotificationChannelAsync(LOW_CREDIT_CHANNEL, {
        name: 'Low credits',
        description: 'When your credits run low.',
        importance: Notifications.AndroidImportance.DEFAULT,
      }),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        channelsReady = null;
        console.warn('[reviewer] notification channels not made', error);
      });
  }
  return channelsReady;
}
