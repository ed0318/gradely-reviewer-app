import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { color, font } from '@/theme/theme';

/** gradely-app's centred tile and wordmark, with "Reviewer" on its highlighter stroke and the tagline. */
export function AuthBrandHeader() {
  return (
    <View style={styles.root}>
      <View style={styles.brandRow} accessible accessibilityRole="header" accessibilityLabel="Gradely Reviewer">
        <AppIconTile size={52} />
        <View>
          <Text style={styles.brand}>Gradely</Text>
          <View style={styles.productWrap}>
            <View style={styles.highlight} />
            <Text style={styles.product}>Reviewer</Text>
          </View>
        </View>
      </View>
      <Text style={styles.tagline}>Make your own reviewer. Take it again and again.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  brand: { fontFamily: font.brand, fontSize: 34, lineHeight: 36, letterSpacing: -0.6, color: color.ink },
  productWrap: { alignSelf: 'flex-start', paddingHorizontal: 4, marginLeft: -4 },
  highlight: { position: 'absolute', left: 0, right: 0, top: '50%', bottom: '6%', backgroundColor: '#FFDD55' },
  product: { fontFamily: font.brand, fontSize: 20, lineHeight: 22, letterSpacing: -0.4, color: color.primary },
  tagline: { fontFamily: font.uiRegular, fontSize: 13.5, color: color.inkMuted, marginTop: 10, textAlign: 'center' },
});
