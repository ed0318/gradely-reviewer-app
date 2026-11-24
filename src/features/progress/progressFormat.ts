import { calculatePercent, formatClock, formatPoints } from '@/features/exams/formatExam';

/** Words and numbers for the Progress tab. Pure, so they are tested. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 0.8667 -> 87. Null (no attempt had points) stays null. */
export function toPercent(fraction: number | null): number | null {
  return fraction === null ? null : Math.round(fraction * 100);
}

/** "87%", or "–" when there is nothing to show. */
export function formatPercentOrDash(fraction: number | null): string {
  const percent = toPercent(fraction);
  return percent === null ? '–' : `${percent}%`;
}

/** "Nov 22", with the year ("Nov 22, 2025") when it is not this year's. Local time. */
export function formatAttemptDate(finishedAt: number, now: number): string {
  const day = new Date(finishedAt);
  const text = `${MONTHS[day.getMonth()]} ${day.getDate()}`;
  return day.getFullYear() === new Date(now).getFullYear() ? text : `${text}, ${day.getFullYear()}`;
}

/** "24/30", points as they were scored. */
export function formatAttemptScore(score: number, totalPoints: number): string {
  return `${formatPoints(score)}/${formatPoints(totalPoints)}`;
}

/** "12:34" for the time an attempt took. */
export function formatAttemptTime(elapsedSeconds: number): string {
  return formatClock(elapsedSeconds);
}

/** An attempt's share of its points, as a whole percent. */
export function attemptPercent(score: number, totalPoints: number): number {
  return calculatePercent(score, totalPoints);
}

export function describeAttemptCount(tries: number): string {
  return `${tries} ${tries === 1 ? 'attempt' : 'attempts'}`;
}
