import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { QuestionType } from '@/db/records';
import { color, font, space } from '@/theme/theme';
import { TYPE_LABEL } from '../questionRules';

/** "MULTIPLE CHOICE · 52 questions", the band above each section. */
export const SectionHeaderRow = memo(function SectionHeaderRow({ type, count }: { type: QuestionType; count: number }) {
  const countLabel = `${count} ${count === 1 ? 'question' : 'questions'}`;
  return (
    <View style={styles.root} accessible accessibilityRole="header" accessibilityLabel={`${TYPE_LABEL[type]}, ${countLabel}`}>
      <Text style={styles.label}>{TYPE_LABEL[type].toUpperCase()}</Text>
      <Text style={styles.count}>{countLabel}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: space.gutter,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: color.paper,
    borderBottomWidth: 1,
    borderBottomColor: color.rule,
  },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted },
  count: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
