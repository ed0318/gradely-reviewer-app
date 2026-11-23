import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormMessage } from '@/components/FormMessage';
import { Icon } from '@/components/Icon';
import { InfoNote } from '@/components/InfoNote';
import { color } from '@/theme/theme';
import { handoverStepStyles } from './handoverStepStyles';
import type { HandoverStepProps } from './handoverStepProps';

/** Step 3 (16c): the backup to save, then the erase. */
export function HandoverEraseStep({ flow, owner }: HandoverStepProps) {
  const first = flow.ownerFirstName;
  const { backup } = flow;
  const { topicCount, questionCount, examCount } = owner.summary;
  return (
    <>
      <Text style={handoverStepStyles.title} accessibilityRole="header">
        {backup.kind === 'none' ? `${first}'s account was deleted` : backup.kind === 'ready' ? `${first}'s backup is ready` : `Backing up ${first}'s topics`}
      </Text>
      <Text style={handoverStepStyles.body}>
        {backup.kind === 'none'
          ? "There's nobody to send a code to, and no backup can be made for a deleted account."
          : `Save it to Files or send it to ${first}, so ${first} can restore it on another phone. Only ${first}'s account can open it.`}
      </Text>
      {backup.kind === 'working' && (
        <View style={[handoverStepStyles.card, handoverStepStyles.row]}>
          <Text style={handoverStepStyles.cardText}>Backing up {first}'s topics…</Text>
        </View>
      )}
      {backup.kind === 'ready' && (
        <View style={[handoverStepStyles.card, handoverStepStyles.row]}>
          <View style={handoverStepStyles.fileIcon}>
            <Icon name="fileCheck" size={20} color={color.ok} />
          </View>
          <View style={handoverStepStyles.fill}>
            <Text style={handoverStepStyles.rowTitle}>{formatBackupTime(backup.file.createdAt)}</Text>
            <Text style={handoverStepStyles.cardText}>
              {formatBackupSize(backup.file.sizeBytes)} · only {first}'s account can open it
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Save ${first}'s backup`} onPress={() => flow.saveBackup(backup.file)} style={handoverStepStyles.saveButton}>
            <Text style={handoverStepStyles.saveText}>Save</Text>
          </Pressable>
        </View>
      )}
      {backup.kind === 'failed' && (
        <View style={handoverStepStyles.card}>
          <FormMessage text={`Couldn't back up ${first}'s topics. Nothing has been erased.`} />
          <Pressable accessibilityRole="button" onPress={flow.retryBackup} style={handoverStepStyles.resend}>
            <Icon name="refresh" size={16} color={color.primary} />
            <Text style={handoverStepStyles.resendText}>Try again</Text>
          </Pressable>
        </View>
      )}
      <InfoNote
        tone="danger"
        icon="warning"
        text={`Erasing removes ${first}'s ${topicCount} topics, ${questionCount} questions and ${examCount} exams from this phone. Then the phone is yours.`}
      />
    </>
  );
}

function formatBackupTime(iso: string): string {
  return `Today, ${new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function formatBackupSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
