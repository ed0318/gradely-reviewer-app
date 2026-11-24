import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { formatCredits } from '@/lib/creditUnits';
import { useSystemInsets } from '@/layout/useLayout';
import { color, font, space } from '@/theme/theme';

type Props = {
  isScheduled: boolean;
  costUnits: number;
  balanceUnits: number | null;
  balanceAfter: number | null;
  problem: string | null;
  isBusy: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
};

/** "Balance after 142 → 134.5" and the button: "Create & start" or "Schedule exam", with the price on it. */
export function CreateExamFooter({ isScheduled, costUnits, balanceUnits, balanceAfter, problem, isBusy, isDisabled, onSubmit }: Props) {
  const { bottom } = useSystemInsets();
  const price = `${formatCredits(costUnits)} credits`;
  const label = isScheduled ? 'Schedule exam' : 'Create & start';
  return (
    <View style={[styles.root, { paddingBottom: Math.max(12, bottom) }]}>
      <FormMessage text={problem} />
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Balance after</Text>
        <Text style={styles.balanceValue}>
          {balanceUnits === null ? '–' : <Text style={styles.before}>{formatCredits(balanceUnits)} → </Text>}
          {balanceAfter === null ? '' : formatCredits(balanceAfter)}
        </Text>
      </View>
      <Button
        label={label}
        accessibilityLabel={`${label}, ${price}`}
        onPress={onSubmit}
        isBusy={isBusy}
        isDisabled={isDisabled}
        trailing={
          <View style={styles.pill}>
            <Text style={styles.pillText}>{price}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingHorizontal: space.gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.surface },
  balance: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  balanceValue: { fontFamily: font.monoStrong, fontSize: 13, color: color.ink },
  before: { fontFamily: font.mono, color: color.inkMuted },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: color.highlight },
  pillText: { fontFamily: font.monoStrong, fontSize: 13, color: color.ink },
});
