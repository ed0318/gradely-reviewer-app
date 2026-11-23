import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LocalDataSummary } from '@/db/repositories/localData';
import { color, font, radius } from '@/theme/theme';

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "ON THIS PHONE · 12 topics · 640 questions · 38 exams". */
export function LocalDataCard({ summary }: { summary: LocalDataSummary }) {
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>ON THIS PHONE</Text>
      <Text style={styles.line}>
        {countLabel(summary.topicCount, 'topic', 'topics')} · {countLabel(summary.questionCount, 'question', 'questions')}
      </Text>
      <Text style={styles.note}>{countLabel(summary.examCount, 'exam', 'exams')}, their scores and progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 2, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted },
  line: { fontFamily: font.rowTitle, fontSize: 16, color: color.ink },
  note: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
});
