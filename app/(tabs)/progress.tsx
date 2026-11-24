import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { buildDeleteExamWarning } from '@/features/exams/deleteExamWarning';
import { ExamPickerBar } from '@/features/progress/components/ExamPickerBar';
import { ExamPickerSheet } from '@/features/progress/components/ExamPickerSheet';
import { ExamProgressView } from '@/features/progress/components/ExamProgressView';
import { useProgressScreen } from '@/features/progress/hooks/useProgressScreen';
import { color, space } from '@/theme/theme';

/**
 * Progress (mockup 8): pick an exam, then its best, average and tries, the last
 * six scores and every attempt in pages of ten. Everything is read from the
 * phone, so it works offline. `?examId=` opens it on an exam (Home sends it).
 */
export default function ProgressScreen() {
  const progress = useProgressScreen();
  const { selected } = progress;
  const warning = buildDeleteExamWarning(progress.deleteWarningAttemptCount ?? 0);

  return (
    <Screen>
      <ScreenHeader eyebrow="PROGRESS" title="Progress" />
      {progress.status === 'loading' && <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading scores" />}
      {progress.status === 'error' && (
        <View style={styles.block}>
          <EmptyState icon="error" title="Couldn't read your scores" subtitle="Something went wrong reading them from this phone." />
          <Button label="Try again" variant="outline" onPress={progress.retry} style={styles.button} />
        </View>
      )}
      {progress.status === 'ready' && !selected && (
        <View style={styles.block}>
          <EmptyState icon="progress" title="No scores yet" subtitle="Finish an exam and its scores show up here." />
          <Button label="New exam" onPress={() => router.push('/exam/new')} style={styles.button} />
        </View>
      )}
      {progress.status === 'ready' && selected && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ExamPickerBar exam={selected} onOpenPicker={progress.openPicker} onDelete={progress.openDelete} />
          <ExamProgressView examId={selected.examId} />
        </ScrollView>
      )}
      <ExamPickerSheet
        visible={progress.isPickerOpen}
        exams={progress.exams}
        currentExamId={selected?.examId ?? null}
        onChoose={progress.chooseExam}
        onClose={progress.closePicker}
      />
      <ConfirmDeleteModal
        visible={progress.deleteWarningAttemptCount !== null && selected !== null}
        title={`Delete “${selected?.name ?? ''}”?`}
        cascadeItems={warning.cascadeItems}
        keepItems={warning.keepItems}
        confirmLabel="Delete exam"
        onCancel={progress.cancelDelete}
        onConfirm={progress.confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: 32, gap: space.gap },
  loading: { marginTop: 48 },
  block: { flex: 1, justifyContent: 'center' },
  button: { marginHorizontal: space.gutter, marginTop: 12 },
});
