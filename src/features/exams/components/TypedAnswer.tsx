import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { color, font, radius } from '@/theme/theme';

/** Identification (one line) and essay (many): typed, and saved as it is typed. */
export function TypedAnswer({ value, isEssay, onChangeText }: { value: string; isEssay: boolean; onChangeText: (text: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline={isEssay}
      placeholder={isEssay ? 'Write your answer' : 'Type your answer'}
      placeholderTextColor={color.inkMuted}
      accessibilityLabel={isEssay ? 'Your essay answer' : 'Your answer'}
      autoCapitalize={isEssay ? 'sentences' : 'none'}
      autoCorrect={isEssay}
      spellCheck={isEssay}
      autoComplete="off"
      returnKeyType={isEssay ? 'default' : 'done'}
      textAlignVertical={isEssay ? 'top' : 'center'}
      style={[styles.input, isEssay && styles.essay]}
    />
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 56, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 1.5, borderColor: color.fieldBorder, backgroundColor: color.surface, fontFamily: font.mono, fontSize: 17, color: color.ink },
  essay: { minHeight: 200, paddingTop: 14, paddingBottom: 14, lineHeight: 24, fontFamily: font.uiRegular, fontSize: 16 },
});
