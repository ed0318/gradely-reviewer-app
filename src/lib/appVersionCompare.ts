/**
 * Compares dotted versions ("1.2" vs "1.10.0") part by part as numbers. A
 * missing part counts as 0; anything unparseable counts as 0 too, so a bad
 * server value never blocks the app.
 */
export function compareVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(parseVersionPart);
  const rightParts = right.split('.').map(parseVersionPart);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function parseVersionPart(part: string): number {
  const value = Number.parseInt(part, 10);
  return Number.isFinite(value) ? value : 0;
}

export function isBelowMinimumVersion(installedVersion: string, minimumVersion: string): boolean {
  return compareVersions(installedVersion, minimumVersion) < 0;
}
