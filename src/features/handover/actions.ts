import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { confirmHandover, sendHandoverCode, type HandoverCodeSent } from '@/api/handover';
import { openDatabase } from '@/db/client';
import { SCHEMA_VERSION } from '@/db/migrations';
import { readAllLocalTables } from '@/db/repositories/localData';
import { decodeBase64, encodeBase64 } from '@/lib/base64';
import { BACKUP_SALT_BYTES, sealBackup, type FileKeyGrant } from './backupEnvelope';

/**
 * The hand-over's steps that leave the screen: the owner's emailed code, the
 * key it releases, and the sealed backup of the owner's topics and exams.
 */

export function sendCodeToOwner(ownerAccountId: string): Promise<HandoverCodeSent> {
  return sendHandoverCode(ownerAccountId);
}

export type CodeConfirmation = { kind: 'owner_gone' } | { kind: 'confirmed'; grant: FileKeyGrant };

/** Spends the owner's code. The phone picks the salt; the server returns the key for that one file. */
export async function confirmOwnerCode(ownerAccountId: string, code: string): Promise<CodeConfirmation> {
  const salt = Crypto.getRandomBytes(BACKUP_SALT_BYTES);
  const confirmation = await confirmHandover({ ownerId: ownerAccountId, code, saltBase64: encodeBase64(salt) });
  if (confirmation.isOwnerGone || !confirmation.fileKey) return { kind: 'owner_gone' };
  return { kind: 'confirmed', grant: { fileKey: decodeBase64(confirmation.fileKey), salt, accountId: confirmation.ownerAccountId ?? ownerAccountId } };
}

export type BackupFile = { uri: string; sizeBytes: number; createdAt: string };

const BACKUP_FOLDER = 'backups';

/** Seals every topic, question, exam and attempt on the phone into one file only the owner can open. */
export async function backUpOwnersData(grant: FileKeyGrant): Promise<BackupFile> {
  const tables = await readAllLocalTables(await openDatabase());
  const createdAt = new Date().toISOString();
  const envelope = sealBackup({ schemaVersion: SCHEMA_VERSION, tables }, grant, Crypto.getRandomBytes, createdAt);

  const folder = new Directory(Paths.document, BACKUP_FOLDER);
  if (!folder.exists) folder.create({ intermediates: true });
  const file = new File(folder, `gradely-reviewer-backup-${createdAt.slice(0, 19).replace(/[:T]/g, '-')}.reviewer`);
  file.write(JSON.stringify(envelope));
  return { uri: file.uri, sizeBytes: file.size, createdAt };
}

/** Opens the share sheet so the file can go to Files, Drive, or the owner. */
export async function shareBackupFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('This phone cannot share files.');
  await Sharing.shareAsync(uri, { mimeType: 'application/octet-stream', dialogTitle: 'Save the Gradely Reviewer backup', UTI: 'public.data' });
}
