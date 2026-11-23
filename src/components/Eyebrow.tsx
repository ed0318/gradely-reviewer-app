import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';

export function Eyebrow({ label, count, trailing }: { label: string; count?: string | number; trailing?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {count != null && (
        <View style={styles.countBox}>
          <Text style={styles.count} maxFontSizeMultiplier={1.4}>
            {count}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1, color: color.inkMuted },
  // The count sits in a small ruled box, like a page number in a ledger.
  countBox: {
    minWidth: 24,
    minHeight: 20,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontFamily: font.eyebrow, fontSize: 11, color: color.inkMuted },
});
