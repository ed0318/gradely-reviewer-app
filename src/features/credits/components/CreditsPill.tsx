import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/Icon';
import { formatCredits } from '@/lib/creditUnits';
import { IOS, IOS_DIM } from '@/theme/press';
import { color, font, radius } from '@/theme/theme';

type CreditsPillProps = { balanceUnits: number | null; onPress: () => void };

/** The balance on a highlighter-yellow pill; "–" until the server has reported one. */
export function CreditsPill({ balanceUnits, onPress }: CreditsPillProps) {
  const amount = balanceUnits === null ? '–' : formatCredits(balanceUnits);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={balanceUnits === null ? 'Credits, balance not loaded yet' : `${amount} credits, see credits`}
      style={({ pressed }) => [styles.root, IOS && pressed && IOS_DIM]}
    >
      <Icon name="credits" size={18} color={color.clay} />
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.unit}>credits</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: color.highlight,
    borderWidth: 1,
    borderColor: '#E9D676',
  },
  amount: { fontFamily: font.monoStrong, fontSize: 15, color: color.ink },
  unit: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
