import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font } from '@/theme/theme';
import type { PasswordRule } from '../passwordRules';

/** Each rule with a check that turns navy once it is met. */
export function PasswordRuleList({ rules }: { rules: PasswordRule[] }) {
  return (
    <View style={styles.root}>
      {rules.map((rule) => (
        <View key={rule.label} style={styles.row} accessible accessibilityLabel={`${rule.label}, ${rule.isMet ? 'done' : 'not yet'}`}>
          <Icon name="check" size={14} color={rule.isMet ? color.primary : color.chevron} />
          <Text style={[styles.text, rule.isMet && styles.met]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  text: { fontFamily: font.uiRegular, fontSize: 12, lineHeight: 16.5, color: color.inkMuted },
  met: { color: color.primary },
});
