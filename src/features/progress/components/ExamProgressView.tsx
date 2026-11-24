import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { color } from '@/theme/theme';
import { useExamProgress } from '../hooks/useExamProgress';
import { AttemptsTable } from './AttemptsTable';
import { ProgressStats } from './ProgressStats';
import { ScoreChart } from './ScoreChart';

/** The blocks under the exam picker: stats, chart and the attempts table, or why there are none. */
export function ExamProgressView({ examId }: { examId: string }) {
  const progress = useExamProgress(examId);
  if (progress.isFailed && progress.summary === null) {
    return (
      <View style={styles.message}>
        <EmptyState inline icon="error" title="Couldn't read this exam's scores" subtitle="Something went wrong reading them from this phone." />
        <Button label="Try again" variant="outline" onPress={progress.retry} />
      </View>
    );
  }
  if (progress.summary === null) return <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading scores" />;
  return (
    <>
      <ProgressStats stats={progress.summary.stats} />
      <ScoreChart inputs={progress.summary.chart} tries={progress.summary.stats.tries} />
      <AttemptsTable page={progress.page} paging={progress.paging} onPrevious={progress.goToPreviousPage} onNext={progress.goToNextPage} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 48 },
  message: { gap: 12 },
});
