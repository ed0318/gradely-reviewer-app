import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import type { TopicListItem } from '@/db/records';
import { useTopicsList } from '@/features/topics/hooks/useTopicsList';
import { color, font, space } from '@/theme/theme';
import { TopicChoiceRow } from './TopicChoiceRow';

const PAGE_SIZE = 30;
const keyOfTopic = (topic: TopicListItem) => topic.id;

/** "Change": every topic on the phone, a page at a time. Android's back closes it. */
export function TopicPickerModal({ visible, onChoose, onClose }: { visible: boolean; onChoose: (topicId: string) => void; onClose: () => void }) {
  const topics = useTopicsList(PAGE_SIZE);
  const handleChoose = useCallback(
    (topicId: string) => {
      onChoose(topicId);
      onClose();
    },
    [onChoose, onClose],
  );
  const renderTopic = useCallback(({ item }: { item: TopicListItem }) => <TopicChoiceRow topic={item} onChoose={handleChoose} />, [handleChoose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Choose a topic
          </Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={22} color={color.ink} />
          </Pressable>
        </View>
        {topics.status === 'error' ? (
          <EmptyState icon="error" title="Couldn't read your topics" subtitle="Close this and try again." />
        ) : topics.status === 'ready' && topics.items.length === 0 ? (
          <EmptyState icon="topics" title="No topics yet" subtitle="Make a topic and add questions first." />
        ) : (
          <FlashList data={topics.items} renderItem={renderTopic} keyExtractor={keyOfTopic} onEndReached={topics.loadMore} onEndReachedThreshold={0.6} contentContainerStyle={styles.list} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.line },
  title: { fontFamily: font.title, fontSize: 24, color: color.ink },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  list: { padding: space.gutter },
});
