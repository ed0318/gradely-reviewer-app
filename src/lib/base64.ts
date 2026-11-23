/** Bytes ↔ base64 for keys, salts and sealed backups. In chunks, so a megabyte backup stays fast. */
export function encodeBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let index = 0; index < bytes.length; index += CHUNK) {
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(index, index + CHUNK))));
  }
  return globalThis.btoa(parts.join(''));
}

export function decodeBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
