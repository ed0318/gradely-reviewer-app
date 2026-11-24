import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type Props = {
  text: string;
  hint: string;
  isValid: boolean;
  onChangeText: (text: string) => void;
  onStep: (step: 1 | -1) => void;
};

/** "Number of items": typed, with − and +. The box turns red and the hint says why when the number is out of range. */
export function ItemCountStepper({ text, hint, isValid, onChangeText, onStep }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.label}>Number of items</Text>
        <Text style={[styles.hint, !isValid && styles.hintBad]} accessibilityLiveRegion="polite">
          {hint}
        </Text>
      </View>
      <View style={styles.row}>
        <StepButton icon="minus" label="Fewer items" onPress={() => onStep(-1)} />
        <TextInput
          value={text}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
          selectTextOnFocus
          accessibilityLabel="Number of items"
          style={[styles.input, !isValid && styles.inputBad]}
        />
        <StepButton icon="plus" label="More items" onPress={() => onStep(1)} />
      </View>
    </View>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'minus' | 'plus'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.step} accessibilityRole="button" accessibilityLabel={label}>
      {icon === 'plus' ? <Icon name="add" size={22} color={color.primary} /> : <Text style={styles.minus}>−</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  label: { fontFamily: font.eyebrow, fontSize: 13, color: color.ink },
  hint: { flexShrink: 1, fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  hintBad: { color: color.rust },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  minus: { fontFamily: font.monoStrong, fontSize: 26, lineHeight: 30, color: color.primary },
  input: { flex: 1, minWidth: 0, height: 52, textAlign: 'center', borderRadius: radius.field, borderWidth: 1.5, borderColor: color.primary, backgroundColor: color.surface, fontFamily: font.monoStrong, fontSize: 24, color: color.ink },
  inputBad: { borderColor: color.rust },
});
