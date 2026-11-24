import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

type Props = { value: string; onChangeText: (text: string) => void; onCommit: (text: string) => void };

/** Mockup 13's "Alert me below [20] credits": the number is typed right in the row, and saved when the box is left. */
export function LowCreditThresholdField({ value, onChangeText, onCommit }: Props) {
  return (
    <View style={styles.root}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={() => onCommit(value)}
        onSubmitEditing={() => onCommit(value)}
        keyboardType="number-pad"
        inputMode="numeric"
        returnKeyType="done"
        maxLength={4}
        selectTextOnFocus
        accessibilityLabel="Alert me below, in credits"
        style={styles.input}
      />
      <Text style={styles.unit}>credits</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { width: 60, height: 44, textAlign: 'center', borderRadius: radius.field, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface, fontFamily: font.monoStrong, fontSize: 14, color: color.ink, padding: 0 },
  unit: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
