import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { BackBar, BarAction } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { useConfirmDelete } from '@/components/ConfirmDeleteModal';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import type { SheetHandle } from '@/components/Sheet';
import { AddQuestionButton } from '@/features/questions/components/AddQuestionButton';
import { QuestionRow } from '@/features/questions/components/QuestionRow';
import { QuestionUndoToast } from '@/features/questions/components/QuestionUndoToast';
import { SectionHeaderRow } from '@/features/questions/components/SectionHeaderRow';
import type { QuestionListEntry } from '@/features/questions/questionListRows';
import { TopicDetailsDialog } from '@/features/topics/components/TopicDetailsDialog';
import { TopicHeaderCard } from '@/features/topics/components/TopicHeaderCard';
import { TopicMenuSheet } from '@/features/topics/components/TopicMenuSheet';
import { TopicSearchBar } from '@/features/topics/components/TopicSearchBar';
import { buildDeleteTopicWarning } from '@/features/topics/deleteTopicWarning';
import { useTopicScreen } from '@/features/topics/hooks/useTopicScreen';
import { color, space } from '@/theme/theme';

const keyOfEntry = (entry: QuestionListEntry) => entry.key;
const typeOfEntry = (entry: QuestionListEntry) => entry.kind;

/** Mockup 3: one topic. Its questions by section, search, Add question, and the ⋯ menu. */
export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const screen = useTopicScreen(id);
  const { summary, questions, entries, deletion } = screen;
  const menuRef = useRef<SheetHandle>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const { confirmDelete, confirmModal } = useConfirmDelete();

  const openMenu = useCallback(() => menuRef.current?.expand(), []);

  const askToDeleteTopic = useCallback(() => {
    if (summary.status !== 'ready') return;
    confirmDelete({
      title: `Delete “${summary.topic.title}”?`,
      confirmLabel: 'Delete topic',
      ...buildDeleteTopicWarning(questions.totalCount, summary.examCount),
      onConfirm: screen.deleteTopicAndLeave,
    });
  }, [summary, questions.totalCount, confirmDelete, screen.deleteTopicAndLeave]);

  const renderEntry = useCallback(
    ({ item }: { item: QuestionListEntry }) =>
      item.kind === 'header' ? (
        <SectionHeaderRow type={item.type} count={item.count} />
      ) : (
        <QuestionRow question={item.question} number={item.number} onOpen={screen.openQuestion} onDelete={screen.deleteQuestion} onOpening={screen.onRowOpening} />
      ),
    [screen.openQuestion, screen.deleteQuestion, screen.onRowOpening],
  );

  const listHeader = useMemo(
    () =>
      summary.status === 'ready' ? (
        <View>
          <TopicHeaderCard topic={summary.topic} questionCount={questions.totalCount} examCount={summary.examCount} onMakeExam={screen.makeExam} />
          <TopicSearchBar questionCount={questions.totalCount} onChangeSearch={screen.setSearch} />
        </View>
      ) : null,
    [summary, questions.totalCount, screen.makeExam, screen.setSearch],
  );

  const listEmpty = useMemo(() => {
    if (questions.status === 'loading') return <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading" />;
    if (questions.status === 'error') {
      return (
        <View>
          <EmptyState inline icon="error" title="Couldn't read the questions" subtitle="Something went wrong reading them from this phone." />
          <Button label="Try again" variant="outline" onPress={questions.retry} style={styles.retry} />
        </View>
      );
    }
    if (screen.isSearching) return <EmptyState inline icon="search" title="No matches" subtitle="No question in this topic matches that search." />;
    return <EmptyState inline icon="topics" title="No questions yet" subtitle="Tap Add question to write the first one." />;
  }, [questions.status, questions.retry, screen.isSearching]);

  if (summary.status !== 'ready') {
    return (
      <Screen>
        <BackBar label="Topics" />
        {summary.status === 'loading' && <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading" />}
        {summary.status === 'missing' && <EmptyState icon="topics" title="Topic not found" subtitle="It may have been deleted." />}
        {summary.status === 'error' && (
          <View style={styles.errorBlock}>
            <EmptyState icon="error" title="Couldn't open the topic" subtitle="Something went wrong reading it from this phone." />
            <Button label="Try again" variant="outline" onPress={screen.retrySummary} style={styles.retry} />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <BackBar label="Topics" trailing={<BarAction icon="moreVertical" accessibilityLabel="Topic options" onPress={openMenu} />} />
      <FlashList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={keyOfEntry}
        getItemType={typeOfEntry}
        onEndReached={questions.loadMore}
        onEndReachedThreshold={1.5}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      />
      {deletion.deleted ? (
        <QuestionUndoToast key={deletion.deleted.question.id} number={deletion.deleted.number} onUndo={deletion.undoDelete} />
      ) : (
        <AddQuestionButton onPress={screen.addQuestion} isBusy={screen.isAdding} />
      )}
      <TopicMenuSheet sheetRef={menuRef} topicTitle={summary.topic.title} onRename={() => setIsRenaming(true)} onDelete={askToDeleteTopic} />
      <TopicDetailsDialog
        visible={isRenaming}
        mode="rename"
        initial={{ title: summary.topic.title, subject: summary.topic.subjectLabel ?? '', directions: summary.topic.generalDirections }}
        onSubmit={(input) => void screen.saveHeader(input).finally(() => setIsRenaming(false))}
        onCancel={() => setIsRenaming(false)}
      />
      {confirmModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 120 },
  loading: { marginTop: 48 },
  retry: { marginHorizontal: space.gutter, marginTop: 8 },
  errorBlock: { flex: 1, justifyContent: 'center' },
});
