import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon } from './Icon';

type Props = {
  label: string;
  /** What the field reads, already formatted. */
  text: string;
  icon: 'event' | 'clock';
  isOpen: boolean;
  onPress: () => void;
};

/** The labelled button that opens a date or time picker. The picker itself is `InlineDateTimePicker`, drawn full width below a row of these. */
export function DateTimeButton({ label, text, icon, isOpen, onPress }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[styles.row, isOpen && styles.rowOpen]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}. Change`}
        accessibilityState={{ expanded: isOpen }}
      >
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {text}
        </Text>
        <Icon name={icon} size={16} color={color.inkMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1.15, minWidth: 0 },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.5, color: color.inkMuted, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
  },
  rowOpen: { backgroundColor: color.field, borderColor: color.primary },
  value: { flex: 1, minWidth: 0, fontFamily: font.uiRegular, fontSize: 13, color: color.ink },
});
