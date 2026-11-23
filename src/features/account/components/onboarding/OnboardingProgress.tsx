import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color } from '@/theme/theme';

/** One dash per step, filled up to the current one. */
export function OnboardingProgress({ step, stepCount }: { step: number; stepCount: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${stepCount}`}>
      {Array.from({ length: stepCount }, (_, index) => (
        <View key={index} style={[styles.dash, index < step && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 10 },
  dash: { flex: 1, height: 3, borderRadius: 999, backgroundColor: color.rule },
  active: { backgroundColor: color.primary },
});
