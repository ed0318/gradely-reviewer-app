/**
 * The schedule's date, time and reminder. Times are epoch milliseconds, kept in
 * UTC; the pickers work in the phone's own time zone.
 */

const MINUTE_MS = 60_000;

/** The chosen day with the chosen clock time, seconds cleared. */
export function composeScheduledAt(day: Date, clockTime: Date): number {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), clockTime.getHours(), clockTime.getMinutes(), 0, 0).getTime();
}

/** Minutes before, typed: digits only, up to 4. Null for an empty box (no reminder). */
export function parseRemindMinutes(text: string): number | null {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits === '' ? null : Number.parseInt(digits, 10);
}

/** When the reminder should ring, or null when it asks for none or would already be past. */
export function computeReminderAt(scheduledAt: number, remindMinutesBefore: number | null, now: number): number | null {
  if (remindMinutesBefore === null) return null;
  const reminderAt = scheduledAt - remindMinutesBefore * MINUTE_MS;
  return reminderAt > now ? reminderAt : null;
}

export function isScheduleInPast(scheduledAt: number, now: number): boolean {
  return scheduledAt <= now;
}

/** Tonight at 7 PM, or tomorrow's if that has passed: where the schedule fields start. */
export function buildDefaultSchedule(now: Date): { day: Date; clockTime: Date } {
  const evening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
  if (evening.getTime() <= now.getTime() + 60 * MINUTE_MS) evening.setDate(evening.getDate() + 1);
  return { day: evening, clockTime: new Date(evening) };
}
