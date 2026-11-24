import * as Notifications from 'expo-notifications';
import { setUpNotificationChannels } from './notificationChannels';

export type NotificationPermission = {
  isGranted: boolean;
  /** False once the phone will not ask again: only its Settings can turn notifications on. */
  canAsk: boolean;
};

export async function readNotificationPermission(): Promise<NotificationPermission> {
  const permission = await Notifications.getPermissionsAsync();
  return { isGranted: permission.granted, canAsk: !permission.granted && permission.canAskAgain };
}

/** Shows the phone's own prompt. Only ever called when the student turns on something that needs it. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  await setUpNotificationChannels();
  const permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return { isGranted: permission.granted, canAsk: !permission.granted && permission.canAskAgain };
}
