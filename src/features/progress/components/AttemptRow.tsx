import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FinishedAttemptScore } from '@/db/repositories/progress';
import { color, font } from '@/theme/theme';
import { formatAttemptDate, formatAttemptScore, formatAttemptTime } from '../progressFormat';

export const ATTEMPT_COLUMNS = { number: 40, score: 64, time: 56 } as const;

/** "22   Nov 21   24/30   12:34". `now` only decides whether the year is shown. */
export const AttemptRow = memo(function AttemptRow({ attempt, now }: { attempt: FinishedAttemptScore; now: number }) {
  const date = formatAttemptDate(attempt.finishedAt, now);
  const score = formatAttemptScore(attempt.score, attempt.totalPoints);
  const time = formatAttemptTime(attempt.elapsedSeconds);
  return (
    <View style={styles.row} accessible accessibilityLabel={`Attempt ${attempt.attemptNumber}, ${date}, score ${score}, time ${time}`}>
      <Text style={[styles.number, { width: ATTEMPT_COLUMNS.number }]}>{attempt.attemptNumber}</Text>
      <Text style={styles.date} numberOfLines={1}>
        {date}
      </Text>
      <Text style={[styles.score, { width: ATTEMPT_COLUMNS.score }]}>{score}</Text>
      <Text style={[styles.time, { width: ATTEMPT_COLUMNS.time }]}>{time}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30, paddingHorizontal: 12, paddingVertical: 4, borderTopWidth: 1, borderTopColor: color.rule },
  number: { fontFamily: font.mono, fontSize: 13, color: color.inkMuted },
  date: { flex: 1, minWidth: 0, fontFamily: font.uiRegular, fontSize: 13, color: color.ink },
  score: { fontFamily: font.monoStrong, fontSize: 13, color: color.ink },
  time: { fontFamily: font.mono, fontSize: 13, color: color.inkMuted },
});
