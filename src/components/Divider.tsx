import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color } from '@/theme/theme';

/** A ledger line between rows. Full width by default, the way a ruled book has them. */
export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.line, { marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  line: { height: 1, backgroundColor: color.line },
});
