import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { SaveStatus } from '@/state/useDebouncedSave';
import { color, font } from '@/theme/theme';

const LOOK: Record<SaveStatus, { label: string; tint: string; icon: 'check' | 'refresh' | 'error' }> = {
  saved: { label: 'Saved', tint: color.ok, icon: 'check' },
  saving: { label: 'Saving…', tint: color.clay, icon: 'refresh' },
  failed: { label: 'Not saved', tint: color.rust, icon: 'error' },
};

/** "✓ Saved" in the editor's header. The words and the icon both say it, not the colour alone. */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  const look = LOOK[status];
  return (
    <View style={styles.root} accessibilityLiveRegion="polite" accessible accessibilityLabel={look.label}>
      <Icon name={look.icon} size={15} color={look.tint} />
      <Text style={[styles.label, { color: look.tint }]} maxFontSizeMultiplier={1.4}>
        {look.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 40, paddingHorizontal: 8 },
  label: { fontFamily: font.eyebrow, fontSize: 13 },
});
