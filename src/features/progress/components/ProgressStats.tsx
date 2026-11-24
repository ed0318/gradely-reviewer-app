import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { formatPercentOrDash } from '../progressFormat';
import type { ExamProgressStats } from '@/db/repositories/progress';

function Stat({ label, value, hasRule }: { label: string; value: string; hasRule: boolean }) {
  return (
    <View style={[styles.stat, hasRule && styles.rule]} accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/** Best, Avg and Tries for the exam on show. */
export function ProgressStats({ stats }: { stats: ExamProgressStats }) {
  return (
    <View style={styles.root}>
      <Stat label="BEST" value={formatPercentOrDash(stats.bestFraction)} hasRule />
      <Stat label="AVG" value={formatPercentOrDash(stats.averageFraction)} hasRule />
      <Stat label="TRIES" value={String(stats.tries)} hasRule={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden', backgroundColor: color.surface },
  stat: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 4, paddingVertical: 8, paddingHorizontal: 12 },
  rule: { borderRightWidth: 1, borderRightColor: color.rule },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.7, color: color.inkMuted },
  value: { fontFamily: font.monoStrong, fontSize: 17, color: color.ink },
});
