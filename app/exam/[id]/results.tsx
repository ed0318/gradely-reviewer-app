import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ChargeSheets } from '@/features/exams/components/ChargeSheets';
import { ResultRow } from '@/features/exams/components/ResultRow';
import { ResultsFooter } from '@/features/exams/components/ResultsFooter';
import { ResultsHeader } from '@/features/exams/components/ResultsHeader';
import { ReviewListHeading } from '@/features/exams/components/ReviewListHeading';
import { buildDeleteExamWarning } from '@/features/exams/deleteExamWarning';
import { useResults } from '@/features/exams/hooks/useResults';
import type { ResultItem } from '@/features/exams/resultItems';
import { color, space } from '@/theme/theme';

const keyOfItem = (item: ResultItem) => item.id;

/** Results (mockup 7). `id` is the attempt's id. Reads only this attempt, from the phone, so it works offline. */
export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const results = useResults(id);
  const { state, markEssay, flow } = results;

  const renderItem = useCallback(({ item }: { item: ResultItem }) => <ResultRow item={item} onMark={markEssay} />, [markEssay]);

  if (state.status === 'loading') {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} accessibilityLabel="Loading results" />
        </View>
      </Screen>
    );
  }
  if (state.status !== 'ready' || !results.summary || !results.retakeOptions) {
    return (
      <Screen>
        <BackBar label="Back" />
        {state.status === 'error' ? (
          <>
            <EmptyState icon="error" title="Couldn't read the results" subtitle="Something went wrong reading them from this phone." />
            <Button variant="quiet" label="Try again" onPress={results.retry} />
          </>
        ) : (
          <EmptyState icon="exam" title="These results are gone" subtitle="The exam may have been deleted." />
        )}
      </Screen>
    );
  }

  const { summary } = results;
  const remark = summary.pendingCount > 0 ? 'mark your essays below' : results.isBest ? 'galing! best score so far' : null;
  const warning = buildDeleteExamWarning(state.attemptCount);

  return (
    <Screen>
      <ResultsHeader
        attemptNumber={state.attempt.attemptNumber}
        examName={state.exam.name}
        score={summary.score}
        totalPoints={summary.totalPoints}
        elapsedSeconds={state.attempt.elapsedSeconds}
        changeText={results.changeText}
        remark={remark}
        onDelete={() => results.setIsDeleteOpen(true)}
      />
      <FlashList
        data={results.items}
        renderItem={renderItem}
        keyExtractor={keyOfItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ReviewListHeading reviewCount={results.reviewCount} totalCount={results.totalCount} showAll={results.showAll} onToggle={results.toggleShowAll} />}
      />
      <ResultsFooter options={results.retakeOptions} isBusy={flow.isBusy} onRetake={results.retake} />
      <ChargeSheets flow={flow} onKeepOffline={flow.dismiss} />
      <ConfirmDeleteModal
        visible={results.isDeleteOpen}
        title={`Delete “${state.exam.name}”?`}
        cascadeItems={warning.cascadeItems}
        keepItems={warning.keepItems}
        confirmLabel="Delete exam"
        onCancel={() => results.setIsDeleteOpen(false)}
        onConfirm={results.deleteExam}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 16 },
});
