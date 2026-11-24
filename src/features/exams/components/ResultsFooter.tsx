import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { formatCredits } from '@/lib/creditUnits';
import { useSystemInsets } from '@/layout/useLayout';
import { color, font, space } from '@/theme/theme';
import type { RetakeOptions } from '../retakeOptions';

type Props = { options: RetakeOptions; isBusy: boolean; onRetake: (mode: 'shuffled' | 'missed') => void };

/** "Retake, shuffled" and "Retake only the N I missed", each with what it will cost. Both are charged. */
export function ResultsFooter({ options, isBusy, onRetake }: Props) {
  const { bottom } = useSystemInsets();
  const shuffledPrice = `${formatCredits(options.shuffled.costUnits)} credits`;
  return (
    <View style={[styles.root, { paddingBottom: Math.max(12, bottom) }]}>
      <Button
        label="Retake, shuffled"
        accessibilityLabel={`Retake, shuffled, ${shuffledPrice}`}
        onPress={() => onRetake('shuffled')}
        isBusy={isBusy}
        leading={<Icon name="shuffle" size={18} color={color.onPrimary} />}
        trailing={
          <View style={styles.pill}>
            <Text style={styles.pillText}>{shuffledPrice}</Text>
          </View>
        }
      />
      {options.missed && (
        <Button
          variant="quiet"
          label={`Retake only the ${options.missed.itemCount} I missed`}
          accessibilityLabel={`Retake only the ${options.missed.itemCount} I missed, ${formatCredits(options.missed.costUnits)} credits`}
          onPress={() => onRetake('missed')}
          isDisabled={isBusy}
          trailing={<Text style={styles.quietPrice}>{formatCredits(options.missed.costUnits)} {options.missed.costUnits === 4 ? 'credit' : 'credits'}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, paddingHorizontal: space.gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.surface },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: color.highlight },
  pillText: { fontFamily: font.monoStrong, fontSize: 13, color: color.ink },
  quietPrice: { fontFamily: font.mono, fontSize: 13, color: color.inkMuted },
});
