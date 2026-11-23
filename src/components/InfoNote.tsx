import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type InfoNoteProps = { text: string; icon?: IconName; tone?: 'info' | 'danger' };

/** A tinted note with an icon: navy for information, red for what will be lost. */
export function InfoNote({ text, icon = 'info', tone = 'info' }: InfoNoteProps) {
  const isDanger = tone === 'danger';
  return (
    <View style={[styles.root, isDanger ? styles.danger : styles.info]}>
      <Icon name={icon} size={16} color={isDanger ? color.rust : color.primary} />
      <Text style={[styles.text, { color: isDanger ? color.dangerInk : color.primary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.card, alignItems: 'flex-start' },
  info: { backgroundColor: color.primaryTint },
  danger: { backgroundColor: color.rustTint, borderWidth: 1, borderColor: color.dangerTintOff },
  text: { flex: 1, fontFamily: font.uiRegular, fontSize: 13, lineHeight: 19 },
});
