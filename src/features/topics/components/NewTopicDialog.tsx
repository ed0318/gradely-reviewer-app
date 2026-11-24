import React, { useState } from 'react';
import { router } from 'expo-router';
import { createTopic } from '../actions';
import { TopicDetailsDialog } from './TopicDetailsDialog';
import type { TopicHeaderInput } from '../topicHeader';

const BLANK_TOPIC: TopicHeaderInput = { title: '', subject: '', directions: '' };

/** Makes a topic and opens it. Used by the Topics tab and by Home's "New topic" card. */
export function NewTopicDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: TopicHeaderInput) => {
    setIsBusy(true);
    setError(null);
    try {
      const topicId = await createTopic(input);
      onClose();
      router.push({ pathname: '/topic/[id]', params: { id: topicId } });
    } catch (caught) {
      console.warn('[reviewer] topic not created', caught);
      setError("Couldn't save the topic on this phone. Try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return <TopicDetailsDialog visible={visible} mode="create" initial={BLANK_TOPIC} error={error} isBusy={isBusy} onSubmit={(input) => void handleSubmit(input)} onCancel={onClose} />;
}
