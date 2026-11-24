import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import type { ReviewedExam } from '@/db/repositories/exams';
import { color, font } from '@/theme/theme';
import { formatPoints } from '../formatExam';

/** "80%  Civil Service — Numerical drill · 30 items · 22 attempts · last 24/30". Opens Progress on this exam. */
export const ReviewedExamRow = memo(function ReviewedExamRow({ exam }: { exam: ReviewedExam }) {
  const open = useCallback(() => router.navigate({ pathname: '/progress', params: { examId: exam.examId } }), [exam.examId]);
  const best = exam.bestFraction === null ? '–' : `${Math.round(exam.bestFraction * 100)}%`;
  const attempts = `${exam.finishedAttemptCount} ${exam.finishedAttemptCount === 1 ? 'attempt' : 'attempts'}`;
  const meta = `${exam.itemCount} items · ${attempts} · last ${formatPoints(exam.lastScore)}/${formatPoints(exam.lastTotalPoints)}`;
  return (
    <Pressable onPress={open} style={styles.row} accessibilityRole="button" accessibilityLabel={`${exam.name}. Best ${best}. ${meta}. Open its progress`}>
      <View style={styles.best}>
        <Text style={styles.bestText}>{best}</Text>
      </View>
      <View style={styles.words}>
        <Text style={styles.name} numberOfLines={1}>
          {exam.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Icon name="chevronRight" size={18} color={color.chevron} />
    </Pressable>
  );
});


const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.rule },
  best: { width: 52, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: color.paper },
  bestText: { fontFamily: font.monoStrong, fontSize: 14, color: color.primary },
  words: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  meta: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
