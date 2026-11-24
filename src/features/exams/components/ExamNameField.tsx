import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

/** The exam's name: what shows on Home and in Progress. */
export function ExamNameField({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>Exam name</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Exam name"
        placeholder="Name this exam"
        placeholderTextColor={color.inkMuted}
        autoCapitalize="sentences"
        autoComplete="off"
        returnKeyType="done"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontFamily: font.eyebrow, fontSize: 13, color: color.ink },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.field,
    fontFamily: font.uiRegular,
    fontSize: 15,
    color: color.ink,
  },
});
