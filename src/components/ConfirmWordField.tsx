import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

type ConfirmWordFieldProps = {
  word: 'CONFIRM' | 'DELETE';
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  isEditable?: boolean;
};

/** "Type CONFIRM to go on": gradely-app's hand-over field, monospace and spaced. */
export function ConfirmWordField({ word, value, onChangeText, label = `Type ${word} to confirm`, isEditable = true }: ConfirmWordFieldProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={word}
        placeholderTextColor={color.chevron}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        editable={isEditable}
        accessibilityLabel={label}
        style={styles.field}
      />
    </View>
  );
}

export function isConfirmWordTyped(word: string, typed: string): boolean {
  return typed.trim().toUpperCase() === word;
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontFamily: font.eyebrow, fontSize: 13, color: color.ink, marginTop: 6 },
  field: {
    height: 48,
    borderWidth: 1.5,
    borderColor: color.fieldBorder,
    borderRadius: radius.field,
    backgroundColor: color.surface,
    paddingHorizontal: 14,
    fontFamily: font.mono,
    fontSize: 16,
    letterSpacing: 2,
    color: color.ink,
  },
});
