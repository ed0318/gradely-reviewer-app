import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { color, font } from '@/theme/theme';

/** A form's error or confirmation, announced when it appears. */
export function FormMessage({ text, tone = 'error' }: { text: string | null; tone?: 'error' | 'saved' }) {
  if (!text) return null;
  return (
    <Text accessibilityLiveRegion="polite" accessibilityRole={tone === 'error' ? 'alert' : 'text'} style={[styles.text, { color: tone === 'error' ? color.rust : color.ok }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({ text: { fontFamily: font.uiRegular, fontSize: 13.5, lineHeight: 19 } });
