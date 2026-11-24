import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { QuestionChoice } from '@/db/records';
import { color, font, radius } from '@/theme/theme';
import { fieldLabelStyle } from './LabeledField';
import { ChoiceRow } from './ChoiceRow';
import { MAX_CHOICES, MIN_CHOICES, choiceLetter } from '../questionRules';

type Props = {
  choices: QuestionChoice[];
  onChangeText: (index: number, text: string) => void;
  onPickCorrect: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

/** CHOICES: two to six, the letters from their places, tap a circle to mark the right one. */
export function ChoiceEditor({ choices, onChangeText, onPickCorrect, onRemove, onAdd }: Props) {
  const canRemove = choices.length > MIN_CHOICES;
  return (
    <View>
      <View style={styles.heading}>
        <Text style={styles.label}>CHOICES</Text>
        <Text style={styles.hint}>Tap the circle on the right answer</Text>
      </View>
      <View style={styles.list}>
        {/* At most six rows, so a plain map; each row is a memo with a stable key. */}
        {choices.map((choice, index) => (
          <ChoiceRow
            key={choice.id}
            index={index}
            letter={choiceLetter(index)}
            text={choice.choiceText}
            isCorrect={choice.isCorrect}
            canRemove={canRemove}
            onChangeText={onChangeText}
            onPickCorrect={onPickCorrect}
            onRemove={onRemove}
          />
        ))}
      </View>
      {choices.length < MAX_CHOICES && (
        <Pressable onPress={onAdd} style={styles.add} accessibilityRole="button" accessibilityLabel={`Add choice ${choiceLetter(choices.length)}`}>
          <Icon name="add" size={17} color={color.primary} />
          <Text style={styles.addLabel}>Add choice {choiceLetter(choices.length)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  label: fieldLabelStyle,
  hint: { flexShrink: 1, fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted, marginBottom: 8, textAlign: 'right' },
  list: { gap: 8 },
  add: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.fieldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addLabel: { fontFamily: font.eyebrow, fontSize: 14, color: color.primary },
});
