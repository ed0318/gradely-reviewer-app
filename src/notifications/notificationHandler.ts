import * as Notifications from 'expo-notifications';

/** A notification that arrives while the app is open still shows, like one that arrives when it is closed. */
export function showNotificationsWhileOpen(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}
