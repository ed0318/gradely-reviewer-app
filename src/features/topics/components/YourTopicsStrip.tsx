import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { TopicListItem } from '@/db/records';
import { color, font } from '@/theme/theme';
import { TopicStripCard } from './TopicStripCard';

const keyOfTopic = (topic: TopicListItem) => topic.id;

/**
 * "Your topics": the most recent few, side by side. At most a handful are ever
 * given to it, so a plain horizontal list is enough (the Topics tab holds the
 * long, recycling one).
 */
export function YourTopicsStrip({ topics }: { topics: TopicListItem[] }) {
  const openTopic = useCallback((topicId: string) => router.push({ pathname: '/topic/[id]', params: { id: topicId } }), []);
  const renderTopic = useCallback(({ item }: { item: TopicListItem }) => <TopicStripCard topic={item} onOpen={openTopic} />, [openTopic]);
  return (
    <View style={styles.root}>
      <Text style={styles.heading} accessibilityRole="header">
        Your topics.
      </Text>
      <FlatList data={topics} renderItem={renderTopic} keyExtractor={keyOfTopic} horizontal showsHorizontalScrollIndicator={false} ItemSeparatorComponent={Gap} />
    </View>
  );
}

const Gap = () => <View style={{ width: 10 }} />;

const styles = StyleSheet.create({
  root: { gap: 10 },
  heading: { fontFamily: font.title, fontSize: 22, color: color.ink },
});
