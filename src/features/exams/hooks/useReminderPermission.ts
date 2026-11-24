import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { readNotificationPermission, requestNotificationPermission, type NotificationPermission } from '@/notifications/notificationPermission';

/**
 * Whether the phone lets the app notify. Asked at the moment it matters (when
 * the student turns on "Schedule it"), after the form has said what the
 * reminder is for, never at launch.
 */
export function useReminderPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    let isActive = true;
    void readNotificationPermission()
      .then((read) => {
        if (isActive) setPermission(read);
      })
      .catch((error: unknown) => console.warn('[reviewer] notification permission unreadable', error));
    return () => {
      isActive = false;
    };
  }, []);

  const ask = useCallback(async () => {
    try {
      setPermission(await requestNotificationPermission());
    } catch (error) {
      console.warn('[reviewer] notification permission not asked', error);
    }
  }, []);

  const openPhoneSettings = useCallback(() => void Linking.openSettings().catch((error: unknown) => console.warn('[reviewer] settings not opened', error)), []);

  return { permission, ask, openPhoneSettings };
}
