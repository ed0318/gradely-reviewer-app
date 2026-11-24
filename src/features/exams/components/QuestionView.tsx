import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AttemptQuestion } from '@/db/records';
import { color, font } from '@/theme/theme';
import { ChoiceAnswer } from './ChoiceAnswer';
import { TrueFalseAnswer } from './TrueFalseAnswer';
import { TypedAnswer } from './TypedAnswer';

type Props = {
  question: AttemptQuestion;
  given: string | null;
  onChoose: (value: string) => void;
  onType: (text: string) => void;
};

/** One question and the control for its type. Keyed by the question, so a typed box never carries over to the next one. */
export function QuestionView({ question, given, onChoose, onType }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.question} accessibilityRole="header">
        {question.question}
      </Text>
      {question.type === 'multiple' && <ChoiceAnswer choices={question.choices ?? []} selected={given} onChoose={onChoose} />}
      {question.type === 'truefalse' && <TrueFalseAnswer selected={given} onChoose={onChoose} />}
      {(question.type === 'identification' || question.type === 'essay') && <TypedAnswer value={given ?? ''} isEssay={question.type === 'essay'} onChangeText={onType} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 22 },
  question: { fontFamily: font.title, fontSize: 25, lineHeight: 31, color: color.ink },
});
