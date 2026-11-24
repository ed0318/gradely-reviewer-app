import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useIsAppActive } from '@/state/useIsAppActive';
import { color, font } from '@/theme/theme';
import { formatClock } from '../formatExam';

/** Seconds taken so far. A ref the screen reads when it saves, so the screen itself does not redraw each second. */
export type ExamClock = { seconds: number };

type Props = { clock: React.MutableRefObject<ExamClock>; isRunning: boolean; onPause: () => void };

/**
 * The time taken. One interval, running only while the exam is on screen and
 * the app is in front: it is cleared when the app goes to the background and
 * when this unmounts, and the time is counted from the clock rather than from
 * the ticks, so a late tick loses nothing.
 */
export function ExamTimerChip({ clock, isRunning, onPause }: Props) {
  const isAppActive = useIsAppActive();
  const [seconds, setSeconds] = useState(clock.current.seconds);
  const isTicking = isRunning && isAppActive;

  useEffect(() => {
    if (!isTicking) return;
    const startedAt = Date.now() - clock.current.seconds * 1000;
    const timer = setInterval(() => {
      clock.current.seconds = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(clock.current.seconds);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTicking, clock]);

  // Going to the background stops the clock and saves where it got to.
  useEffect(() => {
    if (!isAppActive) onPause();
  }, [isAppActive, onPause]);

  return (
    <Text style={styles.time} accessibilityRole="timer" accessibilityLabel={`Time taken ${formatClock(seconds)}`}>
      {formatClock(seconds)}
    </Text>
  );
}

const styles = StyleSheet.create({ time: { fontFamily: font.monoStrong, fontSize: 12, color: color.inkMuted } });
