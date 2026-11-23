import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { color, font } from '@/theme/theme';

/** The tile with "Gradely" over a small "REVIEWER", as in the Home header. */
export function BrandLockup({ tileSize = 38 }: { tileSize?: number }) {
  return (
    <View style={styles.root} accessible accessibilityRole="image" accessibilityLabel="Gradely Reviewer">
      <AppIconTile size={tileSize} />
      <View style={styles.words}>
        <Text style={styles.brand}>Gradely</Text>
        <Text style={styles.product}>REVIEWER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  words: { gap: 2 },
  brand: { fontFamily: font.brand, fontSize: 22, lineHeight: 24, letterSpacing: -0.6, color: color.primary },
  product: { fontFamily: font.uiBold, fontSize: 10, letterSpacing: 2.4, color: color.clay },
});
