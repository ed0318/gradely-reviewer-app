import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryPill } from '@/components/PrimaryPill';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { TopicListItem } from '@/db/records';
import { NewTopicDialog } from '@/features/topics/components/NewTopicDialog';
import { TopicRow } from '@/features/topics/components/TopicRow';
import { useTopicsList } from '@/features/topics/hooks/useTopicsList';
import { color, space } from '@/theme/theme';

const PAGE_SIZE = 30;
const keyOfTopic = (topic: TopicListItem) => topic.id;

/** Topics: every topic on this phone, newest edit first. Making one is free and needs no connection. */
export default function TopicsScreen() {
  const list = useTopicsList(PAGE_SIZE);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);

  const openTopic = useCallback((topicId: string) => router.push({ pathname: '/topic/[id]', params: { id: topicId } }), []);
  const renderTopic = useCallback(({ item }: { item: TopicListItem }) => <TopicRow topic={item} onOpen={openTopic} />, [openTopic]);
  const openNewTopic = useCallback(() => setIsNewTopicOpen(true), []);
  const closeNewTopic = useCallback(() => setIsNewTopicOpen(false), []);

  return (
    <Screen>
      <ScreenHeader eyebrow="TOPICS" title="Topics" action={<PrimaryPill label="New topic" icon="add" onPress={openNewTopic} />} />
      {list.status === 'loading' && <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading topics" />}
      {list.status === 'error' && (
        <View style={styles.block}>
          <EmptyState icon="error" title="Couldn't read your topics" subtitle="Something went wrong reading them from this phone." />
          <Button label="Try again" variant="outline" onPress={list.retry} style={styles.button} />
        </View>
      )}
      {list.status === 'ready' && list.items.length === 0 && (
        <View style={styles.block}>
          <EmptyState icon="topics" title="No topics yet" subtitle="A topic is a set of questions you write. It is free, and it stays on this phone." />
          <Button label="New topic" onPress={openNewTopic} style={styles.button} />
        </View>
      )}
      {list.status === 'ready' && list.items.length > 0 && (
        <FlashList data={list.items} renderItem={renderTopic} keyExtractor={keyOfTopic} onEndReached={list.loadMore} onEndReachedThreshold={1.5} contentContainerStyle={styles.listContent} />
      )}
      <NewTopicDialog visible={isNewTopicOpen} onClose={closeNewTopic} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: space.gutter, paddingBottom: 24 },
  loading: { marginTop: 48 },
  block: { flex: 1, justifyContent: 'center' },
  button: { marginHorizontal: space.gutter, marginTop: 12 },
});
