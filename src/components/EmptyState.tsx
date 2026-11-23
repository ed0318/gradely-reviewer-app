import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';
import { Icon, IconName } from './Icon';

/**
 * The "nothing here yet" panel.
 *
 * `inline` is the same panel sized to sit inside a Card rather than to fill a
 * screen — a section that is empty on an otherwise busy screen should not be
 * claiming the height of one that has nothing on it at all.
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  inline,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  inline?: boolean;
}) {
  return (
    <View style={inline ? styles.inlineRoot : styles.root}>
      <View style={[styles.iconWrap, inline && styles.iconWrapInline]}>
        <Icon name={icon} size={inline ? 21 : 26} color={color.primary} />
      </View>
      <Text style={[styles.title, inline && styles.titleInline]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  inlineRoot: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 24, gap: 6 },
  iconWrap: { width: 56, height: 56, borderRadius: 999, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  iconWrapInline: { width: 44, height: 44, marginBottom: 2 },
  title: { fontFamily: font.title, fontSize: 20, color: color.ink, textAlign: 'center' },
  titleInline: { fontSize: 17 },
  subtitle: { fontFamily: font.rowSubtitle, fontSize: 13, color: color.inkMuted, textAlign: 'center' },
});
