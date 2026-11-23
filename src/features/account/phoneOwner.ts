/**
 * Whose topics are on this phone, and what signing in should do about it.
 *
 * One phone holds one person's reviewers. A different account signing in on a
 * phone that holds someone's topics or exams must go through the hand-over;
 * on an empty phone, or for the same account, it simply becomes the owner.
 */
export type PhoneOwnerDecision = { kind: 'owner' } | { kind: 'handover'; ownerAccountId: string };

export function decidePhoneOwner(input: {
  signedInAccountId: string;
  localOwnerAccountId: string | null;
  hasLocalData: boolean;
}): PhoneOwnerDecision {
  const { signedInAccountId, localOwnerAccountId, hasLocalData } = input;
  if (localOwnerAccountId === null || localOwnerAccountId === signedInAccountId || !hasLocalData) return { kind: 'owner' };
  return { kind: 'handover', ownerAccountId: localOwnerAccountId };
}
