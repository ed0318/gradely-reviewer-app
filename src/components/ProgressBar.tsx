import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color } from '@/theme/theme';

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, height: 5, borderRadius: 999, backgroundColor: color.rule, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 999, backgroundColor: color.primary },
});
