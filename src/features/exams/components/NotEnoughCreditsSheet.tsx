import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { formatCredits } from '@/lib/creditUnits';
import { color, font, radius } from '@/theme/theme';

/** The cheapest credit pack, for the button's words. Packs themselves come with the purchase screens. */
const CHEAPEST_PACK_PRICE = '₱149';

type Props = {
  itemCount: number;
  neededUnits: number;
  balanceUnits: number | null;
  /** Items the balance does pay for (0 when none). Offered only when fewer than were asked for. */
  affordableItems: number;
  onGetCredits: () => void;
  onMakeSmaller?: () => void;
};

/** Mockup 11: the server said 402. Nothing was charged and nothing was saved. */
export function NotEnoughCreditsSheet({ itemCount, neededUnits, balanceUnits, affordableItems, onGetCredits, onMakeSmaller }: Props) {
  const balanceText = balanceUnits === null ? '–' : formatCredits(balanceUnits);
  const canMakeSmaller = onMakeSmaller !== undefined && affordableItems >= 1 && affordableItems < itemCount;
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>NOT ENOUGH CREDITS</Text>
      <Text style={styles.title} accessibilityRole="header">
        A {itemCount}-item exam needs {formatCredits(neededUnits)} credits. You have {balanceText}.
      </Text>
      <View style={styles.table}>
        <View style={[styles.cell, styles.cellDivider]}>
          <Text style={styles.cellLabel}>NEEDED</Text>
          <Text style={styles.cellValue}>{formatCredits(neededUnits)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>BALANCE</Text>
          <Text style={[styles.cellValue, { color: color.rust }]}>{balanceText}</Text>
        </View>
      </View>
      <Button label={`Get credits · from ${CHEAPEST_PACK_PRICE}`} onPress={onGetCredits} />
      {canMakeSmaller && (
        <Button
          variant="outline"
          label={`Make it ${affordableItems} ${affordableItems === 1 ? 'item' : 'items'} instead · ${formatCredits(affordableItems)} credits`}
          onPress={onMakeSmaller}
        />
      )}
      <Text style={styles.note}>Your topics, questions and past scores stay on this phone.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 22 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 1, color: color.rust },
  title: { fontFamily: font.title, fontSize: 26, lineHeight: 30, color: color.ink },
  table: { flexDirection: 'row', borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden' },
  cell: { flex: 1, padding: 12, gap: 2 },
  cellDivider: { borderRightWidth: 1, borderRightColor: color.rule },
  cellLabel: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1, color: color.inkMuted },
  cellValue: { fontFamily: font.monoStrong, fontSize: 22, color: color.ink },
  note: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted, textAlign: 'center' },
});
