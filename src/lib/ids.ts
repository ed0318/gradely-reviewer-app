import * as Crypto from 'expo-crypto';

/** A new row id: a random UUID, so rows made on two phones never collide. */
export function createId(): string {
  return Crypto.randomUUID();
}
