import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Segmented } from '@/components/Segmented';
import { QUESTION_TYPES, type QuestionType } from '@/db/records';
import { fieldLabelStyle } from './LabeledField';
import { TYPE_SHORT } from '../questionRules';

const TYPE_OPTIONS = QUESTION_TYPES.map((type) => ({ key: type, label: TYPE_SHORT[type] }));

/** TYPE: Multiple, T / F, Short or Essay. */
export function QuestionTypePicker({ type, onChangeType }: { type: QuestionType; onChangeType: (type: QuestionType) => void }) {
  return (
    <View>
      <Text style={styles.label}>TYPE</Text>
      <View style={styles.row}>
        <Segmented value={type} onChange={(key) => onChangeType(key as QuestionType)} options={TYPE_OPTIONS} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ label: fieldLabelStyle, row: { flexDirection: 'row' } });
