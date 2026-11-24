import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { color, font, space } from '@/theme/theme';

type Props = { label: string; isBusy: boolean; isDisabled: boolean; note: string; onPress: () => void };

/** "Buy 280 credits · ₱249" and where the money goes, pinned under the packs. */
export function BuyCreditsFooter({ label, isBusy, isDisabled, note, onPress }: Props) {
  return (
    <View style={styles.root}>
      <Button label={label} onPress={onPress} isBusy={isBusy} isDisabled={isDisabled} style={styles.button} />
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.surface },
  button: { minHeight: 54 },
  note: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted, textAlign: 'center' },
});
