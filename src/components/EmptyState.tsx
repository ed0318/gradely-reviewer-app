import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type EmptyStateProps = { icon: IconName; title: string; body: string; action?: React.ReactNode };

/** What a list shows before it has anything in it. */
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWell}>
        <Icon name={icon} color={color.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 8, padding: 20, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  iconWell: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.heading, fontSize: 18, color: color.ink, textAlign: 'center' },
  body: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 20, color: color.inkMuted, textAlign: 'center' },
});
