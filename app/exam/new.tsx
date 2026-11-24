import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ChargeSheets } from '@/features/exams/components/ChargeSheets';
import { CreateExamFooter } from '@/features/exams/components/CreateExamFooter';
import { CreateExamHeader } from '@/features/exams/components/CreateExamHeader';
import { ExamCostStrip } from '@/features/exams/components/ExamCostStrip';
import { ExamNameField } from '@/features/exams/components/ExamNameField';
import { ItemCountStepper } from '@/features/exams/components/ItemCountStepper';
import { SchedulePanel } from '@/features/exams/components/SchedulePanel';
import { ToggleRow } from '@/features/exams/components/ToggleRow';
import { TopicPickerModal } from '@/features/exams/components/TopicPickerModal';
import { TopicPickerRow } from '@/features/exams/components/TopicPickerRow';
import { useCreateExam } from '@/features/exams/hooks/useCreateExam';
import { color, radius, space } from '@/theme/theme';

/** New exam (mockup 5). Opened from Home, or from a topic with its `topicId`. */
export default function NewExamScreen() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const create = useCreateExam(typeof topicId === 'string' ? topicId : undefined);
  const { form, flow } = create;
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (create.topic.status === 'loading') {
    return (
      <Screen>
        <CreateExamHeader />
        <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading your topics" />
      </Screen>
    );
  }
  if (create.topic.status === 'error') {
    return (
      <Screen>
        <CreateExamHeader />
        <EmptyState icon="error" title="Couldn't read your topics" subtitle="Something went wrong reading this phone." />
        <View style={styles.retry}>
          <Button label="Try again" onPress={create.retryTopic} />
        </View>
      </Screen>
    );
  }
  if (create.topic.status === 'empty') {
    return (
      <Screen>
        <CreateExamHeader />
        <EmptyState icon="topics" title="Make a topic first" subtitle="An exam is made from the questions in a topic. Topics are free." />
        <View style={styles.retry}>
          <Button label="Go to Topics" onPress={() => router.navigate('/topics')} />
        </View>
      </Screen>
    );
  }

  const topic = create.topic.topic;
  const hasNoQuestions = topic.questionCount === 0;
  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <CreateExamHeader />
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ExamNameField value={form.name} onChangeText={form.setName} />
          <TopicPickerRow topic={form.topic ?? topic} onChange={() => setIsPickerOpen(true)} />
          <ItemCountStepper text={form.countText} hint={form.hint.text} isValid={form.hint.isValid} onChangeText={form.changeCountText} onStep={form.stepCount} />
          {!hasNoQuestions && <ExamCostStrip itemCount={form.itemCount ?? Number(form.countText || 1)} costUnits={form.costUnits} />}
          <View style={styles.toggles}>
            <ToggleRow title="Shuffle questions" subtitle="New order every time you take it" value={form.shuffleQuestions} onChange={form.setShuffleQuestions} />
            <ToggleRow title="Shuffle choices" subtitle="A–D move around each attempt" value={form.shuffleChoices} onChange={form.setShuffleChoices} />
            <ToggleRow
              title="Schedule it"
              subtitle={form.isScheduled ? 'Pick a date, time and reminder' : 'Off · start right now'}
              value={form.isScheduled}
              onChange={create.toggleSchedule}
              hasDivider={form.isScheduled}
            />
            {form.isScheduled && <SchedulePanel form={form} permission={create.reminderPermission} />}
          </View>
        </ScrollView>
        <CreateExamFooter
          isScheduled={form.isScheduled}
          costUnits={form.costUnits}
          balanceUnits={form.balanceUnits}
          balanceAfter={form.balanceAfter}
          problem={create.visibleProblem}
          isBusy={flow.isBusy}
          isDisabled={hasNoQuestions}
          onSubmit={create.submit}
        />
      </KeyboardAvoidingView>
      <TopicPickerModal visible={isPickerOpen} onChoose={create.chooseTopic} onClose={() => setIsPickerOpen(false)} />
      <ChargeSheets flow={flow} affordableItems={create.affordableItems} onMakeSmaller={create.makeItSmaller} onKeepOffline={leave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.gutter, gap: 14 },
  toggles: { borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden', backgroundColor: color.surface },
  retry: { paddingHorizontal: space.gutter, paddingBottom: 24 },
  loading: { marginTop: 48 },
});
