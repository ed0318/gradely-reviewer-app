import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

type CodeBoxesProps = { value: string; length: number; onChangeText: (value: string) => void; isEditable: boolean };

/**
 * Six boxes drawn over one hidden field. The boxes are only a picture; screen
 * readers find the field, which carries the label.
 */
export function CodeBoxes({ value, length, onChangeText, isEditable }: CodeBoxesProps) {
  const inputRef = useRef<TextInput>(null);
  return (
    <View>
      <Pressable
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        onPress={() => inputRef.current?.focus()}
        style={styles.boxes}
      >
        {Array.from({ length }, (_, index) => (
          <View key={index} style={[styles.box, index === value.length && styles.activeBox]}>
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus
        editable={isEditable}
        accessibilityLabel={`${length}-digit code`}
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 56, borderRadius: radius.card, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  activeBox: { borderWidth: 2, borderColor: color.primary },
  digit: { fontFamily: font.monoStrong, fontSize: 24, color: color.ink },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
