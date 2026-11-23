/** "AR" for Ana Reyes; "?" when there is no name yet. */
export function buildInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return initials || '?';
}

export function buildFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/** "Good morning," before noon, "Good afternoon," until 6 PM, then "Good evening,". */
export function buildGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}
