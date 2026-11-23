import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { color, radius } from '@/theme/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  // A ruled box on the page: white, one ledger line round it, small corners.
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
  },
});
