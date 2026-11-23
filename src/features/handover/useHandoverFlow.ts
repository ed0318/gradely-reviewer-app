import { useState } from 'react';
import { Alert } from 'react-native';
import { isConfirmWordTyped } from '@/components/ConfirmWordField';
import { describeAccountError } from '@/features/account/describeAccountError';
import { completeHandover, type PhoneOwner } from '@/features/account/session';
import { useAccount } from '@/state/AccountProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import type { AccountSnapshot } from '@/features/account/accountSnapshot';
import type { FileKeyGrant } from './backupEnvelope';
import { backUpOwnersData, confirmOwnerCode, sendCodeToOwner, shareBackupFile, type BackupFile } from './actions';

export const HANDOVER_CODE_LENGTH = 6;
export type HandoverStep = 'confirm' | 'code' | 'erase';
export type BackupState = { kind: 'working' } | { kind: 'ready'; file: BackupFile } | { kind: 'failed' } | { kind: 'none' };

/**
 * The three steps, as in gradely-app: type CONFIRM and send the owner a code;
 * enter the code; the backup is made, saved, then the phone is erased.
 */
export function useHandoverFlow(account: AccountSnapshot, owner: PhoneOwner) {
  const { applySession } = useAccount();
  const isMountedRef = useIsMountedRef();
  const [step, setStep] = useState<HandoverStep>('confirm');
  const [typedWord, setTypedWord] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [grant, setGrant] = useState<FileKeyGrant | null>(null);
  const [backup, setBackup] = useState<BackupState>({ kind: 'none' });

  const ownerFirstName = owner.firstName.trim() || 'The owner';
  const isConfirmTyped = isConfirmWordTyped('CONFIRM', typedWord);

  const sendCode = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setErrorMessage(null);
    setNote(null);
    try {
      const sent = await sendCodeToOwner(owner.accountId);
      if (!isMountedRef.current) return;
      if (sent.isOwnerGone) {
        // Nobody to ask, and no account key to back up with.
        setBackup({ kind: 'none' });
        setStep('erase');
        return;
      }
      setSentTo(sent.sentTo);
      if (step === 'code') setNote('Sent. Ask for the new code.');
      setStep('code');
    } catch (error) {
      if (isMountedRef.current) setErrorMessage(describeAccountError(error, `Sending ${ownerFirstName} a code needs a connection. Connect and try again, or sign out.`));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  const runBackup = async (fileGrant: FileKeyGrant) => {
    setBackup({ kind: 'working' });
    try {
      const file = await backUpOwnersData(fileGrant);
      if (isMountedRef.current) setBackup({ kind: 'ready', file });
    } catch (error) {
      console.warn('[reviewer] hand-over backup failed', error);
      if (isMountedRef.current) setBackup({ kind: 'failed' });
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== HANDOVER_CODE_LENGTH || isBusy) return;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const confirmation = await confirmOwnerCode(owner.accountId, value);
      if (!isMountedRef.current) return;
      setStep('erase');
      if (confirmation.kind === 'owner_gone') return setBackup({ kind: 'none' });
      setGrant(confirmation.grant);
      void runBackup(confirmation.grant);
    } catch (error) {
      if (!isMountedRef.current) return;
      setCode('');
      setErrorMessage(describeAccountError(error, 'Checking the code needs a connection. Connect and try again.'));
    } finally {
      if (isMountedRef.current) setIsBusy(false);
    }
  };

  const erase = async () => {
    setIsBusy(true);
    try {
      applySession(await completeHandover(account));
    } catch (error) {
      console.warn('[reviewer] hand-over erase failed', error);
      if (isMountedRef.current) {
        setIsBusy(false);
        Alert.alert('Could not erase', 'Nothing has changed. Try again.');
      }
    }
  };

  const confirmEraseWithoutBackup = () =>
    Alert.alert('Erase without a backup?', `${ownerFirstName}'s topics and exams will be erased from this phone and there will be no copy of them here.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: () => void erase() },
    ]);

  return {
    step,
    ownerFirstName,
    typedWord,
    setTypedWord: (value: string) => {
      setErrorMessage(null);
      setTypedWord(value);
    },
    canSendCode: isConfirmTyped && !isBusy,
    sentTo,
    code,
    setCode: (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, HANDOVER_CODE_LENGTH);
      setCode(digits);
      setErrorMessage(null);
      if (digits.length === HANDOVER_CODE_LENGTH) void submitCode(digits);
    },
    canSubmitCode: code.length === HANDOVER_CODE_LENGTH && !isBusy,
    isBusy,
    errorMessage,
    note,
    backup,
    sendCode: () => void sendCode(),
    submitCode: () => void submitCode(code),
    retryBackup: () => {
      if (grant) void runBackup(grant);
    },
    saveBackup: (file: BackupFile) => void shareBackupFile(file.uri).catch((error: Error) => Alert.alert('Could not share the backup', error.message)),
    erase: backup.kind === 'failed' ? confirmEraseWithoutBackup : () => void erase(),
    canErase: !isBusy && backup.kind !== 'working',
  };
}
