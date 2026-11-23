import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from '@/lib/base64';
import { BACKUP_FORMAT, deriveBackupFileKey, openBackup, sealBackup } from '../backupEnvelope';

const ACCOUNT_KEY = new Uint8Array(32).fill(7);
const SALT = new Uint8Array(16).fill(2);
const OWNER_ID = '0b0f5d6e-1111-4222-8333-944455556666';

/** A counter, so every "random" byte in a test is known. */
function predictableBytes(byteCount: number): Uint8Array {
  return Uint8Array.from({ length: byteCount }, (_, index) => index);
}

describe('backup envelope', () => {
  it('derives the same file key as reviewer-api (hash_hkdf vector)', () => {
    // php: base64_encode(hash_hkdf('sha256', str_repeat("\x07",32), 32, 'gradely-reviewer-backup.v1:<id>', str_repeat("\x02",16)))
    expect(encodeBase64(deriveBackupFileKey(ACCOUNT_KEY, SALT, OWNER_ID))).toBe('QXucRGAdXGLhVNO217RGzW0XMENTUX5PM6E2D4mLtPk=');
  });

  it('seals with the granted key so the owner key opens it again', () => {
    const fileKey = deriveBackupFileKey(ACCOUNT_KEY, SALT, OWNER_ID);
    const payload = { topics: [{ id: 't1', title: 'Cell biology' }] };
    const envelope = sealBackup(payload, { fileKey, salt: SALT, accountId: OWNER_ID }, predictableBytes, '2026-11-24T10:00:00.000Z');

    expect(envelope).toMatchObject({ format: BACKUP_FORMAT, version: 1, accountId: OWNER_ID, salt: encodeBase64(SALT) });
    expect(envelope.ciphertext).not.toContain('Cell biology');
    const reDerived = deriveBackupFileKey(ACCOUNT_KEY, decodeBase64(envelope.salt), envelope.accountId);
    expect(openBackup(envelope, reDerived)).toEqual(payload);
  });

  it('refuses a changed header or a wrong key', () => {
    const fileKey = deriveBackupFileKey(ACCOUNT_KEY, SALT, OWNER_ID);
    const envelope = sealBackup({ ok: true }, { fileKey, salt: SALT, accountId: OWNER_ID }, predictableBytes);
    expect(() => openBackup({ ...envelope, accountId: 'someone-else' }, fileKey)).toThrow();
    expect(() => openBackup(envelope, new Uint8Array(32).fill(9))).toThrow();
  });

  it('refuses a key or salt of the wrong length', () => {
    expect(() => sealBackup({}, { fileKey: new Uint8Array(16), salt: SALT, accountId: OWNER_ID }, predictableBytes)).toThrow(/not valid/);
  });
});
