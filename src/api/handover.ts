import { requestResult } from './client';

/**
 * Signing in on a phone that holds another account's topics, as in Gradely:
 * the owner gets an emailed code, and giving it over is their agreement to back
 * up and erase this phone.
 */

export type HandoverCodeSent = {
  /** The owner's account no longer exists: no code is needed. */
  isOwnerGone: boolean;
  /** The owner's address, masked, to say where the code went. */
  sentTo: string | null;
};

export async function sendHandoverCode(ownerId: string): Promise<HandoverCodeSent> {
  const payload = await requestResult<{ owner_gone: boolean; sent_to: string | null }>('/device/handover/send-code', {
    method: 'POST',
    body: { owner_id: ownerId },
  });
  return { isOwnerGone: payload.owner_gone, sentTo: payload.sent_to ?? null };
}

export type HandoverConfirmationRequest = {
  ownerId: string;
  code: string;
  /** 16 random bytes, base64. The phone picks it; the key for this one backup file is derived from it. */
  saltBase64: string;
};

export type HandoverConfirmation = {
  isOwnerGone: boolean;
  ownerAccountId: string | null;
  /** Base64 key for the one backup file; null when the owner is gone. */
  fileKey: string | null;
};

export async function confirmHandover(confirmation: HandoverConfirmationRequest): Promise<HandoverConfirmation> {
  const payload = await requestResult<{ owner_gone: boolean; account_id?: string | null; file_key?: string | null }>('/device/handover/confirm', {
    method: 'POST',
    body: { owner_id: confirmation.ownerId, code: confirmation.code, salt: confirmation.saltBase64 },
  });
  return { isOwnerGone: payload.owner_gone, ownerAccountId: payload.account_id ?? null, fileKey: payload.file_key ?? null };
}
