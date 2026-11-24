import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { ProgressExam } from '@/db/repositories/progress';
import { color, font } from '@/theme/theme';
import { describeAttemptCount, formatPercentOrDash } from '../progressFormat';

type Props = { exam: ProgressExam; isCurrent: boolean; onChoose: (examId: string) => void };

/** "Numerical drill / Civil Service — Numerical · 23 attempts   87%  ✓". */
export const ExamPickerRow = memo(function ExamPickerRow({ exam, isCurrent, onChoose }: Props) {
  const choose = useCallback(() => onChoose(exam.examId), [onChoose, exam.examId]);
  const best = formatPercentOrDash(exam.bestFraction);
  const detail = [exam.topicTitle, describeAttemptCount(exam.tries)].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={choose}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${exam.name}. ${detail}. Best ${best}`}
      accessibilityState={{ selected: isCurrent }}
    >
      <View style={styles.words}>
        <Text style={styles.name} numberOfLines={2}>
          {exam.name}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Text style={styles.best}>{best}</Text>
      <View style={styles.check}>{isCurrent && <Icon name="check" size={20} color={color.primary} />}</View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.rule },
  words: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  detail: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  best: { fontFamily: font.monoStrong, fontSize: 13, color: color.inkMuted },
  check: { width: 20, height: 20 },
});
