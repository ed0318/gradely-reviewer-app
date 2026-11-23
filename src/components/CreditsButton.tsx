import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { formatCredits } from '@/lib/creditUnits';
import { useCredits } from '@/state/CreditsProvider';
import { color, font, radius } from '@/theme/theme';
import { Icon } from './Icon';

/**
 * The balance beside the picture in every tab's header, where gradely-app has
 * its bell; it opens Credits. "–" until the server has reported a balance.
 */
export function CreditsButton() {
  const router = useRouter();
  const { balanceUnits } = useCredits();
  const amount = balanceUnits === null ? '–' : formatCredits(balanceUnits);
  return (
    <Pressable
      onPress={() => router.push('/credits')}
      hitSlop={{ top: 10, left: 8, right: 6, bottom: 6 }}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={balanceUnits === null ? 'Credits' : `${amount} credits`}
    >
      <Icon name="credits" size={15} color={color.clay} />
      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E9D676',
    backgroundColor: color.highlight,
  },
  amount: { fontFamily: font.monoStrong, fontSize: 13, color: color.ink },
});
