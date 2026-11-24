import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import type { Topic } from '@/db/records';
import { color, font, space } from '@/theme/theme';

type Props = {
  topic: Topic;
  questionCount: number;
  examCount: number;
  onMakeExam: () => void;
};

/** The topic's title, how much is in it, and the way to make an exam from it. */
export function TopicHeaderCard({ topic, questionCount, examCount, onMakeExam }: Props) {
  const eyebrow = topic.subjectLabel ? `TOPIC · ${topic.subjectLabel.toUpperCase()}` : 'TOPIC';
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow} numberOfLines={1}>
        {eyebrow}
      </Text>
      <Text style={styles.title} accessibilityRole="header">
        {topic.title}
      </Text>
      <View style={styles.counts}>
        <Text style={styles.countText}>
          <Text style={styles.countNumber}>{questionCount}</Text> {questionCount === 1 ? 'question' : 'questions'}
        </Text>
        <Text style={styles.countText}>
          <Text style={styles.countNumber}>{examCount}</Text> {examCount === 1 ? 'exam' : 'exams'} made
        </Text>
      </View>
      <Button
        label="Make an exam from this topic"
        onPress={onMakeExam}
        isDisabled={questionCount === 0}
        accessibilityLabel={questionCount === 0 ? 'Make an exam from this topic. Add a question first.' : 'Make an exam from this topic'}
        leading={<Icon name="exam" size={18} color={questionCount === 0 ? color.inkMuted : color.onPrimary} />}
      />
      {questionCount === 0 && <Text style={styles.hint}>No questions yet. Add one to make an exam.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 16, gap: 10, backgroundColor: color.paper, borderBottomWidth: 1, borderBottomColor: color.line, marginBottom: 12 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted },
  title: { fontFamily: font.title, fontSize: 30, lineHeight: 33, letterSpacing: -0.5, color: color.ink },
  counts: { flexDirection: 'row', gap: 16 },
  countText: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  countNumber: { fontFamily: font.monoStrong, color: color.ink },
  hint: { fontFamily: font.uiRegular, fontSize: 12.5, color: color.inkMuted },
});
