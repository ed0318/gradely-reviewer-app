/** `?, ?, ?` for an `IN (...)` list of `count` values. */
export function buildPlaceholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

export const toSqlBoolean = (value: boolean): number => (value ? 1 : 0);
