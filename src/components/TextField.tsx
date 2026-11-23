import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, font, radius } from '@/theme/theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  errorMessage?: string | null;
  /** Monospace and spaced, for a typed confirmation word. */
  isMonospace?: boolean;
};

/** A labelled input. The label is the field's accessible name; an error is announced with it. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, errorMessage, isMonospace = false, ...inputProps }, ref) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={errorMessage ?? undefined}
        placeholderTextColor={color.chevron}
        style={[styles.input, isMonospace && styles.monospace, !!errorMessage && styles.inputError]}
        {...inputProps}
      />
      {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontFamily: font.rowTitle, fontSize: 13, color: color.ink },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.field,
    fontFamily: font.uiRegular,
    fontSize: 15,
    color: color.ink,
  },
  monospace: { fontFamily: font.monoStrong, fontSize: 16, letterSpacing: 1, backgroundColor: color.surface },
  inputError: { borderColor: color.rust },
  error: { fontFamily: font.uiRegular, fontSize: 13, color: color.rust },
});
