import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { useConfirmDelete } from '@/components/ConfirmDeleteModal';
import { EmptyState } from '@/components/EmptyState';
import { InfoNote } from '@/components/InfoNote';
import { Screen } from '@/components/Screen';
import { AnswerSection } from '@/features/questions/components/AnswerSection';
import { LabeledField } from '@/features/questions/components/LabeledField';
import { MoveButtons } from '@/features/questions/components/MoveButtons';
import { PointsField } from '@/features/questions/components/PointsField';
import { QuestionTypePicker } from '@/features/questions/components/QuestionTypePicker';
import { SaveIndicator } from '@/features/questions/components/SaveIndicator';
import { useQuestionEditor } from '@/features/questions/hooks/useQuestionEditor';
import { QUESTION_PLACEHOLDER, findQuestionProblem } from '@/features/questions/questionRules';
import { color, font, space } from '@/theme/theme';

/** Mockup 4: write one question. Saves as you type; Move up / Move down act within its section. */
export default function QuestionEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const editor = useQuestionEditor(id);
  const { confirmDelete, confirmModal } = useConfirmDelete();
  const { question, place } = editor;

  if (!question) {
    return (
      <Screen>
        <BackBar label="Topic" />
        {editor.loadStatus === 'loading' && <ActivityIndicator style={styles.centered} color={color.primary} accessibilityLabel="Loading question" />}
        {editor.loadStatus === 'missing' && <EmptyState icon="topics" title="Question not found" subtitle="It may have been deleted." />}
        {editor.loadStatus === 'error' && (
          <View style={styles.centered}>
            <EmptyState icon="error" title="Couldn't open the question" subtitle="Something went wrong reading it from this phone." />
            <Button label="Try again" variant="outline" onPress={editor.retry} style={styles.retry} />
          </View>
        )}
      </Screen>
    );
  }

  const problem = findQuestionProblem(question);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/topics'));
  const finish = () => void editor.flush().then(leave);
  const askToDelete = () =>
    confirmDelete({
      title: 'Delete this question?',
      confirmWord: null,
      cascadeItems: [{ label: place ? `Question ${place.number}` : 'This question', detail: question.question.trim() || 'No wording yet.' }],
      onConfirm: () => {
        leave();
        void editor.deleteThisQuestion();
      },
    });

  return (
    <Screen>
      <BackBar label="Topic" trailing={<SaveIndicator status={editor.saveStatus} />} />
      <Text style={styles.title} accessibilityRole="header">
        {place ? `Question ${place.number}` : 'Question'}
      </Text>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <QuestionTypePicker type={question.type} onChangeType={(type) => editor.change({ kind: 'type', type })} />
          <LabeledField
            label="QUESTION"
            value={question.question}
            onChangeText={(text) => editor.change({ kind: 'wording', text })}
            placeholder={QUESTION_PLACEHOLDER[question.type]}
            isMultiline
            shouldAutoFocus={!question.question}
          />
          <PointsField key={question.id} initialPoints={question.point} onChangePoints={(value) => editor.change({ kind: 'points', value })} />
          <AnswerSection question={question} onChange={editor.change} />
          {problem && <InfoNote tone="danger" icon="error" text={problem} />}
          {place && <MoveButtons canMoveUp={place.indexInSection > 0} canMoveDown={place.indexInSection < place.sectionSize - 1} onMove={(direction) => void editor.move(direction)} />}
          <Button label="Done" onPress={finish} />
          <Pressable onPress={askToDelete} style={styles.delete} accessibilityRole="button" accessibilityLabel="Delete question">
            <Text style={styles.deleteLabel}>Delete question</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      {confirmModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontFamily: font.title, fontSize: 28, letterSpacing: -0.4, color: color.ink, paddingHorizontal: space.gutter, paddingBottom: 14 },
  content: { paddingHorizontal: space.gutter, paddingBottom: 40, gap: 20 },
  centered: { flex: 1, justifyContent: 'center' },
  retry: { marginHorizontal: space.gutter },
  delete: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { fontFamily: font.ui, fontSize: 14, color: color.rust },
});
