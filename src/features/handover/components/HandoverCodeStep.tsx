import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormMessage } from '@/components/FormMessage';
import { Icon } from '@/components/Icon';
import { InfoNote } from '@/components/InfoNote';
import { color } from '@/theme/theme';
import { HANDOVER_CODE_LENGTH } from '../useHandoverFlow';
import { CodeBoxes } from './CodeBoxes';
import { handoverStepStyles } from './handoverStepStyles';
import type { HandoverStepProps } from './handoverStepProps';

/** Step 2 (16b): the owner's 6-digit code. */
export function HandoverCodeStep({ flow }: HandoverStepProps) {
  const first = flow.ownerFirstName;
  return (
    <>
      <Text style={handoverStepStyles.title} accessibilityRole="header">
        Enter {first}'s code
      </Text>
      <Text style={handoverStepStyles.body}>
        We sent a 6-digit code to <Text style={handoverStepStyles.strong}>{flow.sentTo ?? `${first}'s email`}</Text>. The email tells {first} who's asking and what will be erased.
      </Text>
      <CodeBoxes value={flow.code} length={HANDOVER_CODE_LENGTH} onChangeText={flow.setCode} isEditable={!flow.isBusy} />
      <FormMessage text={flow.errorMessage} />
      <InfoNote icon="clock" text="A code lasts 15 minutes and can only be used once. Nothing is erased yet." />
      <FormMessage text={flow.errorMessage ? null : flow.note} tone="saved" />
      <Pressable accessibilityRole="button" onPress={flow.sendCode} disabled={flow.isBusy} style={handoverStepStyles.resend}>
        <Icon name="refresh" size={16} color={color.primary} />
        <Text style={handoverStepStyles.resendText}>Send a new code</Text>
      </Pressable>
      <View style={handoverStepStyles.card}>
        <Text style={handoverStepStyles.eyebrow}>CAN'T REACH {first.toUpperCase()}?</Text>
        <Text style={handoverStepStyles.cardText}>
          Sign out and leave {first}'s topics on the phone. If this phone is yours now, clear the app's data in your phone's settings, or delete and
          reinstall the app. That erases it without a code.
        </Text>
      </View>
    </>
  );
}
