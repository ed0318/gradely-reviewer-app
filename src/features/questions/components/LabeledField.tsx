import React from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, font, radius } from '@/theme/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isMultiline?: boolean;
  isMono?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
  shouldAutoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A labelled text box for the editor: one line, or several for the wording and the answer guide. */
export function LabeledField({ label, value, onChangeText, placeholder, isMultiline, isMono, keyboardType, shouldAutoFocus, style }: Props) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkMuted}
        accessibilityLabel={label}
        multiline={isMultiline}
        keyboardType={keyboardType}
        autoFocus={shouldAutoFocus}
        // Wording is read by people, so the keyboard may help; the answer to match is typed as meant.
        autoCorrect={isMultiline ?? false}
        returnKeyType={isMultiline ? 'default' : 'done'}
        style={[styles.input, isMultiline && styles.multiline, isMono && styles.mono]}
      />
    </View>
  );
}

export const fieldLabelStyle = { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginBottom: 8 } as const;

const styles = StyleSheet.create({
  label: fieldLabelStyle,
  input: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    borderRadius: radius.field,
    minHeight: 50,
    paddingHorizontal: 16,
    fontFamily: font.uiRegular,
    fontSize: 16,
    color: color.ink,
  },
  multiline: { minHeight: 96, paddingTop: 14, paddingBottom: 14, lineHeight: 23, textAlignVertical: 'top' },
  mono: { fontFamily: font.mono, fontSize: 16 },
});
