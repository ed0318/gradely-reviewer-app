import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AttemptChoice } from '@/db/records';
import { color, font, radius } from '@/theme/theme';

const LETTERS = 'ABCDEF';

/** Multiple choice: tap an option. The answer is its place in the shown list. */
export function ChoiceAnswer({ choices, selected, onChoose }: { choices: AttemptChoice[]; selected: string | null; onChoose: (value: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Choices" style={styles.list}>
      {choices.map((choice, index) => {
        const isOn = selected === String(index);
        return (
          <Pressable
            key={`${index}:${choice.choiceText}`}
            onPress={() => onChoose(String(index))}
            accessibilityRole="radio"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={`${LETTERS[index]}. ${choice.choiceText}`}
            style={[styles.option, isOn && styles.optionOn]}
          >
            <View style={[styles.badge, isOn && styles.badgeOn]}>
              <Text style={[styles.letter, isOn && styles.letterOn]}>{LETTERS[index]}</Text>
            </View>
            <Text style={styles.text}>{choice.choiceText}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  optionOn: { borderWidth: 2, borderColor: color.primary, backgroundColor: color.primaryTint },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: color.paper },
  badgeOn: { backgroundColor: color.primary },
  letter: { fontFamily: font.monoStrong, fontSize: 14, color: color.inkMuted },
  letterOn: { color: color.onPrimary },
  text: { flex: 1, fontFamily: font.mono, fontSize: 16, color: color.ink },
});
