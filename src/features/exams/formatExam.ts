import type { AttemptScore } from '@/db/repositories/attempts';
import { roundPoints } from './scoreAttempt';

/** Words and numbers for scores, times and schedules. Pure, so they are tested. */

/** 26 -> "26", 7.5 -> "7.5". */
export function formatPoints(points: number): string {
  return String(roundPoints(points));
}

/** Share of points as a whole percent. 0 when nothing was worth points. */
export function calculatePercent(score: number, totalPoints: number): number {
  return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
}

/** 754 -> "12:34", 3725 -> "1:02:05". The ticking clock. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

/** 754 -> "12 min 34 s": time taken, for the results. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds} s`;
  return seconds % 60 === 0 ? `${minutes} min` : `${minutes} min ${seconds % 60} s`;
}

/** "+2 from last time", "same as last time", or null when there was no earlier attempt. */
export function describeScoreChange(previous: AttemptScore | null, current: AttemptScore): string | null {
  if (!previous) return null;
  if (previous.totalPoints === current.totalPoints) {
    const delta = roundPoints(current.score - previous.score);
    if (delta === 0) return 'same as last time';
    return `${delta > 0 ? '+' : '−'}${formatPoints(Math.abs(delta))} from last time`;
  }
  // The two had different totals (a retake of the missed ones), so compare shares.
  const delta = calculatePercent(current.score, current.totalPoints) - calculatePercent(previous.score, previous.totalPoints);
  if (delta === 0) return 'same as last time';
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}% from last time`;
}

/** Whether this attempt beat every other one. Needs at least one other to mean anything. */
export function isBestSoFar(best: AttemptScore | null, current: AttemptScore): boolean {
  if (!best || current.totalPoints <= 0) return false;
  // Cross-multiplied, so no division is compared.
  return current.score * best.totalPoints >= best.score * current.totalPoints;
}

/** "Wed, Nov 26 · 7:00 PM". */
export function formatScheduledAt(scheduledAt: number | null): string {
  if (scheduledAt === null) return 'Not scheduled';
  const when = new Date(scheduledAt);
  const day = when.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} · ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

/** "Numerical drill · attempt 23" for the take screen's header line. */
export function describeAttemptLine(examName: string, attemptNumber: number, isShuffled: boolean): string {
  return `${examName} · attempt ${attemptNumber}${isShuffled ? ' · shuffled' : ''}`;
}
