import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ConfirmWordField } from '@/components/ConfirmWordField';
import { FormMessage } from '@/components/FormMessage';
import { color, font, radius } from '@/theme/theme';
import type { useAccountExit } from '../hooks/useAccountExit';

/** Deleting the account: what goes, then "Type DELETE to confirm". */
export function DeleteAccountSection({ exit }: { exit: ReturnType<typeof useAccountExit> }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Delete account</Text>
      <Text style={styles.body}>
        Your account, your credits and their history are deleted from our server. Your topics, exams and photo are erased from this phone. This
        cannot be undone.
      </Text>
      <ConfirmWordField word="DELETE" value={exit.typedWord} onChangeText={exit.setTypedWord} isEditable={!exit.isDeleting} />
      <FormMessage text={exit.deleteError} />
      <Button label="Delete my account" variant="danger" onPress={exit.deleteAccount} isBusy={exit.isDeleting} isDisabled={!exit.canDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: color.dangerTintOff, backgroundColor: color.rustTint },
  title: { fontFamily: font.rowTitle, fontSize: 15, color: color.rust },
  body: { fontFamily: font.uiRegular, fontSize: 13, lineHeight: 19, color: color.dangerInk },
});
