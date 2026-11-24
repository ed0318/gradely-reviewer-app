import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type Props = {
  index: number;
  letter: string;
  text: string;
  isCorrect: boolean;
  canRemove: boolean;
  onChangeText: (index: number, text: string) => void;
  onPickCorrect: (index: number) => void;
  onRemove: (index: number) => void;
};

/** One choice: the circle to mark it correct, its letter, its text, and a remove control. */
export const ChoiceRow = memo(function ChoiceRow({ index, letter, text, isCorrect, canRemove, onChangeText, onPickCorrect, onRemove }: Props) {
  const handleChangeText = useCallback((next: string) => onChangeText(index, next), [onChangeText, index]);
  const handlePick = useCallback(() => onPickCorrect(index), [onPickCorrect, index]);
  const handleRemove = useCallback(() => onRemove(index), [onRemove, index]);
  return (
    <View style={[styles.row, isCorrect && styles.rowCorrect]}>
      <Pressable
        onPress={handlePick}
        hitSlop={4}
        style={styles.circle}
        accessibilityRole="radio"
        accessibilityState={{ selected: isCorrect }}
        accessibilityLabel={`Choice ${letter} is the correct answer`}
      >
        <Icon name={isCorrect ? 'radioOn' : 'radioOff'} size={26} color={isCorrect ? color.ok : color.fieldBorder} />
      </Pressable>
      <Text style={styles.letter}>{letter}</Text>
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        placeholder={`Choice ${letter}`}
        placeholderTextColor={color.inkMuted}
        accessibilityLabel={`Choice ${letter}`}
        returnKeyType="done"
        style={styles.input}
      />
      {canRemove && (
        <Pressable onPress={handleRemove} hitSlop={4} style={styles.remove} accessibilityRole="button" accessibilityLabel={`Remove choice ${letter}`}>
          <Icon name="close" size={18} color={color.chevron} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 52, paddingHorizontal: 4, borderRadius: radius.field, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface },
  // The right one reads by its filled circle and green edge, not by colour alone.
  rowCorrect: { borderColor: color.ok, borderWidth: 1.5, backgroundColor: color.paper },
  circle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  letter: { width: 18, fontFamily: font.monoStrong, fontSize: 14, color: color.inkMuted },
  input: { flex: 1, minWidth: 0, minHeight: 44, fontFamily: font.uiRegular, fontSize: 16, color: color.ink, paddingVertical: 8 },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
