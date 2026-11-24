import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { color, radius, space } from '@/theme/theme';

type Props = { canGoBack: boolean; isLast: boolean; isBusy: boolean; onPrevious: () => void; onNext: () => void };

/** Previous, and Next question (Finish on the last one). */
export function TakeFooter({ canGoBack, isLast, isBusy, onPrevious, onNext }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={onPrevious}
        disabled={!canGoBack}
        style={[styles.previous, !canGoBack && styles.previousOff]}
        accessibilityRole="button"
        accessibilityLabel="Previous question"
        accessibilityState={{ disabled: !canGoBack }}
      >
        <Icon name="chevronLeft" size={24} color={color.ink} />
      </Pressable>
      <Button style={styles.next} label={isLast ? 'Finish' : 'Next question'} onPress={onNext} isBusy={isBusy} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: 10, paddingHorizontal: space.gutter, paddingVertical: 12, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line },
  previous: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field, borderWidth: 1, borderColor: color.line },
  previousOff: { opacity: 0.4 },
  next: { flex: 1, minHeight: 54 },
});
