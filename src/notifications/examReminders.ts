import * as Notifications from 'expo-notifications';
import { computeReminderAt } from '@/features/exams/scheduleTimes';
import { EXAM_REMINDER_CHANNEL, setUpNotificationChannels } from './notificationChannels';
import { readNotificationPermission } from './notificationPermission';

/**
 * A local reminder for a scheduled exam: one notification at the start time
 * minus the minutes the student chose. Everything that touches
 * `expo-notifications` for exams is here. The notification's id is kept on the
 * attempt, so rescheduling or deleting can cancel it.
 */

/** What a reminder needs to say, and when. */
export type ExamReminder = {
  attemptId: string;
  examName: string;
  itemCount: number;
  scheduledAt: number;
  remindMinutesBefore: number;
};

/** The route data a tap on the reminder carries. */
export type ExamReminderData = { kind: 'exam-reminder'; attemptId: string };

function describeReminder(reminder: ExamReminder): string {
  const items = `${reminder.itemCount} ${reminder.itemCount === 1 ? 'item' : 'items'}`;
  return reminder.remindMinutesBefore === 0
    ? `${reminder.examName} starts now · ${items}`
    : `${reminder.examName} starts in ${reminder.remindMinutesBefore} min · ${items}`;
}

/**
 * Schedules the reminder and returns its id, or null when none was needed (no
 * minutes chosen, or the moment has passed) or the phone will not show
 * notifications. Never throws: a reminder that cannot be set must not stop an
 * exam being made.
 */
export async function scheduleExamReminder(reminder: ExamReminder, now: number = Date.now()): Promise<string | null> {
  const fireAt = computeReminderAt(reminder.scheduledAt, reminder.remindMinutesBefore, now);
  if (fireAt === null) return null;
  try {
    if (!(await readNotificationPermission()).isGranted) return null;
    await setUpNotificationChannels();
    const data: ExamReminderData = { kind: 'exam-reminder', attemptId: reminder.attemptId };
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Time to review', body: describeReminder(reminder), data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt), channelId: EXAM_REMINDER_CHANNEL },
    });
  } catch (error) {
    console.warn('[reviewer] reminder not scheduled', error);
    return null;
  }
}

/** Cancels reminders by id. Ids the phone no longer holds are ignored. */
export async function cancelExamReminders(notificationIds: readonly string[]): Promise<void> {
  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.warn('[reviewer] reminder not cancelled', error);
    }
  }
}

/** Ids the phone is holding right now. */
export async function listHeldReminderIds(): Promise<Set<string>> {
  const held = await Notifications.getAllScheduledNotificationsAsync();
  return new Set(held.map((request) => request.identifier));
}

/** Cancels every reminder this app holds: a hand-over erases the owner's exams, and their reminders must not ring for the next person. */
export async function cancelAllExamReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[reviewer] reminders not cleared', error);
  }
}
