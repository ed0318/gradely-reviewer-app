import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon, IconName } from './Icon';

export function InfoNote({
  text,
  icon = 'info',
  tone = 'neutral',
  style,
}: {
  text: string;
  icon?: IconName;
  tone?: 'neutral' | 'danger';
  style?: ViewStyle;
}) {
  const bg = tone === 'danger' ? color.rustTint : color.rule;
  const fg = tone === 'danger' ? color.dangerInk : color.inkMuted;
  const iconColor = tone === 'danger' ? color.rust : color.inkMuted;
  return (
    <View style={[styles.row, { backgroundColor: bg }, style]}>
      <Icon name={icon} size={18} color={iconColor} />
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, borderRadius: radius.card, padding: 14, paddingHorizontal: 16 },
  text: { flex: 1, fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 19 },
});
