import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type Props = { canMoveUp: boolean; canMoveDown: boolean; onMove: (direction: -1 | 1) => void };

/** Move up / Move down within the section. A section's edge is a disabled button. */
export function MoveButtons({ canMoveUp, canMoveDown, onMove }: Props) {
  return (
    <View style={styles.row}>
      <MoveButton label="Move up" icon="chevronUp" isEnabled={canMoveUp} onPress={() => onMove(-1)} />
      <MoveButton label="Move down" icon="expandMore" isEnabled={canMoveDown} onPress={() => onMove(1)} />
    </View>
  );
}

function MoveButton({ label, icon, isEnabled, onPress }: { label: string; icon: 'chevronUp' | 'expandMore'; isEnabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!isEnabled}
      style={[styles.button, !isEnabled && styles.off]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isEnabled }}
    >
      <Icon name={icon} size={18} color={color.primary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
    borderRadius: radius.field,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.4 },
  label: { fontFamily: font.eyebrow, fontSize: 13.5, color: color.primary },
});
