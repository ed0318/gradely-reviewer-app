import React from 'react';
import { Text } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { ConfirmWordField } from '@/components/ConfirmWordField';
import { FormMessage } from '@/components/FormMessage';
import { InfoNote } from '@/components/InfoNote';
import { handoverStepStyles } from './handoverStepStyles';
import { LocalDataCard } from './LocalDataCard';
import type { HandoverStepProps } from './handoverStepProps';

/** Step 1 (16): what is on the phone, why it goes, and CONFIRM. */
export function HandoverConfirmStep({ flow, owner }: HandoverStepProps) {
  const ownerName = `${owner.firstName} ${owner.lastName}`.trim() || 'Another person';
  const first = flow.ownerFirstName;
  return (
    <>
      <AppIconTile size={52} />
      <Text style={handoverStepStyles.title} accessibilityRole="header">
        This phone has another person's reviewers
      </Text>
      <Text style={handoverStepStyles.body}>
        {ownerName} used Gradely Reviewer on this phone. To use it here, {first}'s topics and exams have to be erased from this phone first.
      </Text>
      <LocalDataCard summary={owner.summary} />
      <InfoNote text={`Topics live only on the phone. One phone holds one person's reviewers, so you never see someone else's. ${first}'s credits stay safe in their account.`} />
      <InfoNote icon="lock" text={`We'll email ${first} a code. Once you enter it, the app backs up ${first}'s topics so you can save them for ${first} before anything is erased.`} />
      <ConfirmWordField word="CONFIRM" label="Type CONFIRM to go on" value={flow.typedWord} onChangeText={flow.setTypedWord} isEditable={!flow.isBusy} />
      <FormMessage text={flow.errorMessage} />
    </>
  );
}
