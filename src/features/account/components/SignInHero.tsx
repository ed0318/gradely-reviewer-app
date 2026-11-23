import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { color, font } from '@/theme/theme';

/** The tile, "Gradely Reviewer" with its highlighter stroke, and the promise. */
export function SignInHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.root}>
      <View style={styles.lockup} accessible accessibilityRole="image" accessibilityLabel="Gradely Reviewer">
        <AppIconTile size={44} />
        <Text style={styles.brand}>
          Gradely <Text style={styles.highlighted}> Reviewer </Text>
        </Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontFamily: font.brand, fontSize: 22, letterSpacing: -0.6, color: color.primary },
  highlighted: { backgroundColor: '#FFDD55' },
  title: { fontFamily: font.title, fontSize: 32, lineHeight: 34, letterSpacing: -0.3, color: color.ink, marginTop: 6 },
  subtitle: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted },
});
