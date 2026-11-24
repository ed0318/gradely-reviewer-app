import * as Notifications from 'expo-notifications';
import { formatCredits, UNITS_PER_EXAM_ITEM } from '@/lib/creditUnits';
import { LOW_CREDIT_CHANNEL, setUpNotificationChannels } from './notificationChannels';
import { readNotificationPermission } from './notificationPermission';

/** Rings the low-credit alert now. True when it was handed to the phone; false when notifications are off. Never throws. */
export async function showLowCreditNotification(balanceUnits: number): Promise<boolean> {
  try {
    if (!(await readNotificationPermission()).isGranted) return false;
    await setUpNotificationChannels();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Running low on credits', body: `You have ${formatCredits(balanceUnits)} credits left. Each exam item costs ${formatCredits(UNITS_PER_EXAM_ITEM)}.` },
      trigger: { channelId: LOW_CREDIT_CHANNEL },
    });
    return true;
  } catch (error) {
    console.warn('[reviewer] low credit alert not shown', error);
    return false;
  }
}
