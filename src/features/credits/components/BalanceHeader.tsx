import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { formatCredits } from '@/lib/creditUnits';
import { color, font, space } from '@/theme/theme';

/** Mockup 10's top band: "Credits you can use", the balance big, and Get more credits. */
export function BalanceHeader({ balanceUnits, onGetCredits }: { balanceUnits: number | null; onGetCredits: () => void }) {
  const amount = balanceUnits === null ? '–' : formatCredits(balanceUnits);
  return (
    <View style={styles.band}>
      <View style={styles.balance} accessible accessibilityLabel={`Credits you can use: ${amount}`}>
        <Text style={styles.eyebrow}>CREDITS YOU CAN USE</Text>
        <Text style={styles.amount} adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {amount}
        </Text>
      </View>
      <Button label="Get more credits" onPress={onGetCredits} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 14, backgroundColor: color.paper, borderBottomWidth: 1, borderBottomColor: color.line },
  balance: { flexShrink: 1, gap: 2 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 1, color: color.inkMuted },
  amount: { fontFamily: font.title, fontSize: 48, lineHeight: 52, color: color.ink },
  button: { minHeight: 44, paddingHorizontal: 14 },
});
