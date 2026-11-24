import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Row } from '@/components/Row';
import type { TopicListItem } from '@/db/records';
import { color, radius } from '@/theme/theme';
import { describeQuestionCount } from '../describeQuestionCount';

type Props = { topic: TopicListItem; onOpen: (topicId: string) => void };

/** One topic on the Topics tab: its title, and its subject and question count beneath. */
export const TopicRow = memo(function TopicRow({ topic, onOpen }: Props) {
  const handleOpen = useCallback(() => onOpen(topic.id), [onOpen, topic.id]);
  const questions = describeQuestionCount(topic.questionCount);
  return (
    <View style={styles.card}>
      <Row title={topic.title} subtitle={topic.subjectLabel ? `${topic.subjectLabel} · ${questions}` : questions} showChevron onPress={handleOpen} minHeight={64} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, overflow: 'hidden', marginBottom: 10 },
});
