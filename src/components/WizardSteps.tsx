import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';
import { Icon } from './Icon';

/**
 * The strip across the top of a wizard: one numbered dot per step, joined by a
 * line, with the step the teacher is on filled in and the ones behind them
 * ticked.
 *
 * A step is only tappable when everything before it is complete (`reach` is
 * the furthest one open), so the strip can jump back freely but cannot skip
 * past a step that is still owed something.
 */
export function WizardSteps({
  steps,
  current,
  reach,
  onSelect,
}: {
  steps: string[];
  current: number;
  /** The furthest step index the teacher may open. */
  reach: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const open = i <= reach;
        return (
          <React.Fragment key={label}>
            {i > 0 && <View style={[styles.line, i <= current && styles.lineDone]} />}
            <Pressable
              style={styles.step}
              disabled={!open || active}
              onPress={() => onSelect(i)}
              hitSlop={6}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: !open }}
              accessibilityLabel={`Step ${i + 1}, ${label}`}
            >
              <View style={[styles.dot, active && styles.dotActive, done && styles.dotDone]}>
                {done ? (
                  <Icon name="check" size={15} color={color.primary} />
                ) : (
                  <Text style={[styles.dotLabel, active && styles.dotLabelActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.label, (active || done) && styles.labelOn, !open && styles.labelOff]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const DOT = 28;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { alignItems: 'center', gap: 6, minWidth: 74 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.rule,
  },
  dotActive: { backgroundColor: color.primary },
  dotDone: { backgroundColor: color.primaryTint },
  dotLabel: { fontFamily: font.eyebrow, fontSize: 12.5, color: color.inkMuted },
  dotLabelActive: { color: color.onPrimary },
  label: { fontFamily: font.ui, fontSize: 12, color: color.inkMuted },
  labelOn: { color: color.ink },
  labelOff: { opacity: 0.6 },
  // Centred on the dots rather than on the labels under them.
  line: { flex: 1, height: 2, marginTop: DOT / 2 - 1, backgroundColor: color.rule },
  lineDone: { backgroundColor: color.primary },
});
