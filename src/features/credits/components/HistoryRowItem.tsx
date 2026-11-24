import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';
import type { HistoryRow } from '../historyRows';

/** "Exam name · 30 items" over when it happened, and the signed credits on the right (purchases green, +). */
export const HistoryRowItem = memo(function HistoryRowItem({ row }: { row: HistoryRow }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={row.spokenLabel}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {row.title}
        </Text>
        <Text style={styles.when}>{row.when}</Text>
      </View>
      <Text style={[styles.amount, row.isGain && styles.amountGain]}>{row.amount}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.rule },
  text: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontFamily: font.rowTitle, fontSize: 14, lineHeight: 19, color: color.ink },
  when: { fontFamily: font.uiRegular, fontSize: 12, lineHeight: 16, color: color.inkMuted },
  amount: { fontFamily: font.monoStrong, fontSize: 15, color: color.ink },
  amountGain: { color: color.ok },
});
