import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { TopicListItem } from '@/db/records';
import { color, font, radius } from '@/theme/theme';
import { describeQuestionCount } from '../describeQuestionCount';

/** One topic in Home's "Your topics" strip: its name and how many questions it holds. */
export const TopicStripCard = memo(function TopicStripCard({ topic, onOpen }: { topic: TopicListItem; onOpen: (topicId: string) => void }) {
  const handleOpen = useCallback(() => onOpen(topic.id), [onOpen, topic.id]);
  return (
    <Pressable onPress={handleOpen} style={styles.card} accessibilityRole="button" accessibilityLabel={`${topic.title}, ${describeQuestionCount(topic.questionCount)}`}>
      <Text style={styles.name} numberOfLines={3}>
        {topic.title}
      </Text>
      <Text style={styles.count}>{describeQuestionCount(topic.questionCount)}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { width: 148, minHeight: 88, justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: radius.card, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  name: { fontFamily: font.rowTitle, fontSize: 14, lineHeight: 18, color: color.ink },
  count: { fontFamily: font.mono, fontSize: 12, color: color.inkMuted },
});
