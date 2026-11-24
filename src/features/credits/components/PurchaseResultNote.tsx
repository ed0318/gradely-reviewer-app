import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { InfoNote } from '@/components/InfoNote';
import { formatCredits } from '@/lib/creditUnits';
import { color, font } from '@/theme/theme';
import type { PurchaseView } from '../hooks/useBuyCredits';

type Props = { purchase: PurchaseView; balanceUnits: number | null; onCheckAgain: () => void; onDismiss: () => void };

/** What happened to the purchase, in plain words, above the Buy button. Nothing while idle or working. */
export function PurchaseResultNote({ purchase, balanceUnits, onCheckAgain, onDismiss }: Props) {
  switch (purchase.kind) {
    case 'credited':
      return (
        <View style={styles.root}>
          <Text style={styles.success} accessibilityLiveRegion="polite" accessibilityRole="alert">
            {formatCredits(purchase.addedUnits)} credits added.{balanceUnits === null ? '' : ` You now have ${formatCredits(balanceUnits)}.`}
          </Text>
          <Button label="Done" variant="quiet" onPress={onDismiss} />
        </View>
      );
    case 'pending':
      return (
        <View style={styles.root}>
          <InfoNote icon="clock" text="Payment received. Your credits are on the way. This can take a minute, and you won't be charged again." />
          <Button label="Check again" variant="outline" onPress={onCheckAgain} isBusy={purchase.isChecking} />
        </View>
      );
    case 'offline':
      return (
        <View style={styles.root}>
          <InfoNote icon="wifi" tone="danger" text="You're offline. Nothing was bought. Connect to the internet and try again." />
        </View>
      );
    case 'failed':
      return (
        <View style={styles.root}>
          <InfoNote icon="error" tone="danger" text={purchase.message} />
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: { gap: 8, paddingTop: 8, paddingBottom: 4 },
  success: { fontFamily: font.rowTitle, fontSize: 14, lineHeight: 20, color: color.ok },
});
