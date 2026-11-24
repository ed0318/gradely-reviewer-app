import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Row } from '@/components/Row';
import type { TopicListItem } from '@/db/records';
import { describeQuestionCount } from '@/features/topics/describeQuestionCount';
import { color, radius } from '@/theme/theme';

/** One topic in the picker. A topic with no questions cannot make an exam, so it is shown but not pressable. */
export const TopicChoiceRow = memo(function TopicChoiceRow({ topic, onChoose }: { topic: TopicListItem; onChoose: (topicId: string) => void }) {
  const handleChoose = useCallback(() => onChoose(topic.id), [onChoose, topic.id]);
  const questions = describeQuestionCount(topic.questionCount);
  return (
    <View style={styles.card}>
      <Row
        title={topic.title}
        subtitle={topic.questionCount === 0 ? 'No questions yet' : topic.subjectLabel ? `${topic.subjectLabel} · ${questions}` : questions}
        subtitleColor={topic.questionCount === 0 ? color.rust : color.inkMuted}
        onPress={topic.questionCount === 0 ? undefined : handleChoose}
        showChevron={topic.questionCount > 0}
        minHeight={60}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, overflow: 'hidden', marginBottom: 10 },
});
