import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCredits, UNITS_PER_EXAM_ITEM } from '@/lib/creditUnits';
import { color, font, radius } from '@/theme/theme';

/** "30 items × 0.25 = 7.5 credits": the price in the highlighter yellow. Never a float: units to credits for display only. */
export function ExamCostStrip({ itemCount, costUnits }: { itemCount: number; costUnits: number }) {
  return (
    <View style={styles.root} accessible accessibilityLabel={`${itemCount} items at ${formatCredits(UNITS_PER_EXAM_ITEM)} credit each is ${formatCredits(costUnits)} credits`}>
      <Text style={styles.sum}>
        {itemCount} items × {formatCredits(UNITS_PER_EXAM_ITEM)}
      </Text>
      <Text style={styles.total}>
        <Text style={styles.amount}>{formatCredits(costUnits)}</Text> credits
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.field, backgroundColor: color.highlight, borderWidth: 1, borderColor: '#E9D676' },
  sum: { fontFamily: font.mono, fontSize: 14, color: color.inkMuted },
  total: { fontFamily: font.uiRegular, fontSize: 13, color: color.ink },
  amount: { fontFamily: font.monoStrong, fontSize: 18 },
});
