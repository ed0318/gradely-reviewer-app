import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';

type Props = { title: string; subtitle: string; value: boolean; onChange: (next: boolean) => void; hasDivider?: boolean };

/** A switch with a title and a line under it. The whole row reads as one switch to a screen reader. */
export function ToggleRow({ title, subtitle, value, onChange, hasDivider = true }: Props) {
  return (
    <View style={[styles.row, hasDivider && styles.divider]}>
      <View style={styles.words}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color.primary }} accessibilityLabel={title} accessibilityHint={subtitle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: color.rule },
  words: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  subtitle: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
