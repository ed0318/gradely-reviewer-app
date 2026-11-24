import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EditorDialog, Field } from '@/components/EditorDialog';
import { findTopicHeaderProblem, type TopicHeaderInput } from '../topicHeader';

type Props = {
  visible: boolean;
  mode: 'create' | 'rename';
  /** What the fields start with when it opens. */
  initial: TopicHeaderInput;
  error?: string | null;
  isBusy?: boolean;
  onSubmit: (input: TopicHeaderInput) => void;
  onCancel: () => void;
};

/** The topic's title, subject and general directions: one form for making a topic and for renaming it. */
export function TopicDetailsDialog({ visible, mode, initial, error, isBusy, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<TopicHeaderInput>(initial);
  const [wasVisible, setWasVisible] = useState(visible);
  // Each time it opens, the fields start again from `initial` (set while rendering, not in an effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(initial);
  }

  const canSave = findTopicHeaderProblem(draft) === null && !isBusy;
  return (
    <EditorDialog
      visible={visible}
      title={mode === 'create' ? 'New topic' : 'Rename topic'}
      subtitle={mode === 'create' ? 'Free, and it stays on this phone. Add questions next.' : undefined}
      error={error}
      saveLabel={mode === 'create' ? 'Create topic' : 'Save'}
      saveDisabled={!canSave}
      onSave={() => onSubmit(draft)}
      onCancel={onCancel}
    >
      <View style={styles.fields}>
        <Field label="TITLE" value={draft.title} onChangeText={(title) => setDraft((previous) => ({ ...previous, title }))} placeholder="e.g. Civil Service — Numerical" autoCapitalize="sentences" autoFocus />
        <Field label="SUBJECT (OPTIONAL)" value={draft.subject} onChangeText={(subject) => setDraft((previous) => ({ ...previous, subject }))} placeholder="e.g. Mathematics" autoCapitalize="sentences" />
        <Field
          label="GENERAL DIRECTIONS (OPTIONAL)"
          value={draft.directions}
          onChangeText={(directions) => setDraft((previous) => ({ ...previous, directions }))}
          placeholder="Shown once above the first section of an exam."
          autoCapitalize="sentences"
          multiline
        />
      </View>
    </EditorDialog>
  );
}

const styles = StyleSheet.create({ fields: { gap: 16 } });
