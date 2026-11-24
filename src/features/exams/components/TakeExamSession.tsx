import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { ConfirmDeleteModal, type CascadeItem } from '@/components/ConfirmDeleteModal';
import { space } from '@/theme/theme';
import { describeAttemptLine } from '../formatExam';
import type { AttemptToTake } from '../hooks/useAttemptToTake';
import { useTakeSession } from '../hooks/useTakeSession';
import { QuestionView } from './QuestionView';
import { TakeFooter } from './TakeFooter';
import { TakeHeader } from './TakeHeader';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The exam on screen, once it is open: one question at a time (mockup 6). */
export function TakeExamSession({ data }: { data: Extract<AttemptToTake, { status: 'ready' }> }) {
  const session = useTakeSession(data);
  const { attempt, exam, questions } = data;
  const { counts } = session;

  const submitItems: CascadeItem[] = [];
  if (counts.unanswered > 0) submitItems.push({ label: 'Left blank', detail: plural(counts.unanswered, 'question') });
  if (counts.flagged > 0) submitItems.push({ label: 'Flagged', detail: plural(counts.flagged, 'question') });
  if (submitItems.length === 0) submitItems.push({ label: 'All answered', detail: 'Every question has an answer.' });

  return (
    <>
      <TakeHeader
        position={session.index + 1}
        total={questions.length}
        isFlagged={session.answer?.isFlagged ?? false}
        line={describeAttemptLine(exam.name, attempt.attemptNumber, attempt.sourceAttemptId !== null && !attempt.onlyMissed)}
        clock={session.clockRef}
        isClockRunning={!session.isQuitOpen && !session.isFinishing}
        onQuit={() => session.setIsQuitOpen(true)}
        onToggleFlag={session.toggleFlag}
        onPause={session.persistProgress}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <QuestionView key={session.question.id} question={session.question} given={session.answer?.given ?? null} onChoose={session.choose} onType={session.type} />
        </ScrollView>
        <TakeFooter canGoBack={session.index > 0} isLast={session.isLast} isBusy={session.isFinishing} onPrevious={session.previous} onNext={session.next} />
      </KeyboardAvoidingView>

      <ConfirmDeleteModal
        visible={session.isQuitOpen}
        title="Leave this exam?"
        cascadeHeading="WHAT HAPPENS"
        cascadeItems={[{ label: 'Your answers are saved', detail: 'Continue from Home any time. The clock stops while you are away.' }]}
        confirmWord={null}
        confirmLabel="Leave"
        warning={null}
        tone="primary"
        onCancel={() => session.setIsQuitOpen(false)}
        onConfirm={() => {
          session.setIsQuitOpen(false);
          session.leave();
        }}
      />
      <ConfirmDeleteModal
        visible={session.isFinishOpen}
        title="Submit your answers?"
        cascadeHeading="BEFORE YOU SUBMIT"
        cascadeItems={submitItems}
        confirmWord={null}
        confirmLabel="Submit"
        warning={null}
        tone="primary"
        onCancel={() => session.setIsFinishOpen(false)}
        onConfirm={() => void session.finish()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.gutter, paddingTop: 26, paddingBottom: 24, flexGrow: 1 },
});
