import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Segmented } from '@/components/Segmented';
import type { TopicQuestion } from '@/db/records';
import type { DraftChange } from '../questionDraft';
import { ChoiceEditor } from './ChoiceEditor';
import { LabeledField, fieldLabelStyle } from './LabeledField';
import { LinesStepper } from './LinesStepper';

const TRUE_FALSE_OPTIONS = [
  { key: 'true', label: 'True' },
  { key: 'false', label: 'False' },
];

/** The part of the editor that depends on the type: choices, True/False, the exact answer, or an essay's guide and lines. */
export function AnswerSection({ question, onChange }: { question: TopicQuestion; onChange: (change: DraftChange) => void }) {
  switch (question.type) {
    case 'multiple':
      return (
        <ChoiceEditor
          choices={question.choices}
          onChangeText={(index, text) => onChange({ kind: 'choiceText', index, text })}
          onPickCorrect={(index) => onChange({ kind: 'correctChoice', index })}
          onRemove={(index) => onChange({ kind: 'removeChoice', index })}
          onAdd={() => onChange({ kind: 'addChoice' })}
        />
      );
    case 'truefalse':
      return (
        <View>
          <Text style={styles.label}>CORRECT ANSWER</Text>
          <View style={styles.row}>
            <Segmented value={question.answerIsTrue ? 'true' : 'false'} onChange={(key) => onChange({ kind: 'answerIsTrue', value: key === 'true' })} options={TRUE_FALSE_OPTIONS} />
          </View>
        </View>
      );
    case 'identification':
      return (
        <LabeledField
          label="CORRECT ANSWER"
          value={question.answer}
          onChangeText={(text) => onChange({ kind: 'answer', text })}
          placeholder="The exact answer to match"
        />
      );
    case 'essay':
      return (
        <View style={styles.essay}>
          <LabeledField
            label="ANSWER GUIDE (OPTIONAL)"
            value={question.answerGuide ?? ''}
            onChangeText={(text) => onChange({ kind: 'answerGuide', text })}
            placeholder="What a good answer includes. Shown when you mark it yourself."
            isMultiline
          />
          <LinesStepper lines={question.lines} onChangeLines={(value) => onChange({ kind: 'lines', value })} />
        </View>
      );
  }
}

const styles = StyleSheet.create({ label: fieldLabelStyle, row: { flexDirection: 'row' }, essay: { gap: 20 } });
