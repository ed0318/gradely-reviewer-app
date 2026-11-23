import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeBase64, encodeBase64 } from '@/lib/base64';

/**
 * The sealed backup file, as gradely-app seals one.
 *
 * The file key comes from the owner's account key (held only on the server)
 * and a salt the phone picks, through HKDF with
 * `info = "gradely-reviewer-backup.v1:<accountId>"`, exactly as
 * reviewer-api's `HandoverService::deriveBackupFileKey` does. So the server can
 * hand this phone the key for ONE file, and later the owner's account key
 * re-derives it from the salt in the file to restore it. Nobody else can open it.
 *
 * The header is not encrypted (the account id must be readable before any key
 * exists) but it is the AEAD's associated data, so changing it breaks the tag.
 */

export const BACKUP_FORMAT = 'gradely-reviewer-backup';
export const BACKUP_VERSION = 1;
export const BACKUP_SALT_BYTES = 16;
const NONCE_BYTES = 24;
const KEY_BYTES = 32;

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  version: number;
  accountId: string;
  createdAt: string;
  salt: string;
  nonce: string;
  ciphertext: string;
};

/** The key for one file, as the server returned it for the salt the phone sent. */
export type FileKeyGrant = { fileKey: Uint8Array; salt: Uint8Array; accountId: string };

export class BackupKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupKeyError';
  }
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** The same derivation as the server, for restoring with the account key later. */
export function deriveBackupFileKey(accountKey: Uint8Array, salt: Uint8Array, accountId: string): Uint8Array {
  return hkdf(sha256, accountKey, salt, textEncoder.encode(`${BACKUP_FORMAT}.v${BACKUP_VERSION}:${accountId}`), KEY_BYTES);
}

function buildAssociatedData(header: Pick<BackupEnvelope, 'format' | 'version' | 'accountId' | 'createdAt'>): Uint8Array {
  return textEncoder.encode(`${header.format}|${header.version}|${header.accountId}|${header.createdAt}`);
}

/** Seals `payload` (any JSON value) with the granted file key. `randomBytes` is the platform CSPRNG. */
export function sealBackup(
  payload: unknown,
  grant: FileKeyGrant,
  randomBytes: (byteCount: number) => Uint8Array,
  createdAt: string = new Date().toISOString(),
): BackupEnvelope {
  if (grant.fileKey.length !== KEY_BYTES || grant.salt.length !== BACKUP_SALT_BYTES) {
    throw new BackupKeyError('The key for this backup is not valid.');
  }
  const header = { format: BACKUP_FORMAT, version: BACKUP_VERSION, accountId: grant.accountId, createdAt } as const;
  const nonce = randomBytes(NONCE_BYTES);
  const ciphertext = xchacha20poly1305(grant.fileKey, nonce, buildAssociatedData(header)).encrypt(textEncoder.encode(JSON.stringify(payload)));
  return { ...header, salt: encodeBase64(grant.salt), nonce: encodeBase64(nonce), ciphertext: encodeBase64(ciphertext) };
}

/** Opens a sealed backup with its file key. Throws if the key is wrong or the file was changed. */
export function openBackup(envelope: BackupEnvelope, fileKey: Uint8Array): unknown {
  const plaintext = xchacha20poly1305(fileKey, decodeBase64(envelope.nonce), buildAssociatedData(envelope)).decrypt(decodeBase64(envelope.ciphertext));
  return JSON.parse(textDecoder.decode(plaintext));
}
