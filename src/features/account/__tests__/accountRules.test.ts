import { describe, expect, it } from 'vitest';
import { ApiError, OfflineError, RequestCancelledError } from '@/api/errors';
import { compareVersions, isBelowMinimumVersion } from '@/lib/appVersionCompare';
import { buildFullName, buildGreeting, buildInitials } from '@/lib/personName';
import { describeAccountError } from '../describeAccountError';
import { decidePhoneOwner } from '../phoneOwner';

describe('phone owner', () => {
  it('lets the first account own an empty phone', () => {
    expect(decidePhoneOwner({ signedInAccountId: 'b', localOwnerAccountId: null, hasLocalData: false })).toEqual({ kind: 'owner' });
  });

  it('lets the owner back in', () => {
    expect(decidePhoneOwner({ signedInAccountId: 'a', localOwnerAccountId: 'a', hasLocalData: true })).toEqual({ kind: 'owner' });
  });

  it("sends a second account on a used phone to the hand-over, always", () => {
    expect(decidePhoneOwner({ signedInAccountId: 'b', localOwnerAccountId: 'a', hasLocalData: true })).toEqual({ kind: 'handover', ownerAccountId: 'a' });
  });

  it('lets a second account take a phone the owner left empty', () => {
    expect(decidePhoneOwner({ signedInAccountId: 'b', localOwnerAccountId: 'a', hasLocalData: false })).toEqual({ kind: 'owner' });
  });
});

describe('app version', () => {
  it('compares part by part as numbers', () => {
    expect(compareVersions('1.10', '1.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.3', '1.3')).toBe(-1);
  });

  it('blocks only below the minimum, and never on a bad value', () => {
    expect(isBelowMinimumVersion('1.0', '1.1')).toBe(true);
    expect(isBelowMinimumVersion('1.1', '1.1')).toBe(false);
    expect(isBelowMinimumVersion('1.0', 'garbage')).toBe(false);
  });
});

describe('names', () => {
  it('makes initials, full names and greetings', () => {
    expect(buildInitials('ana', 'Reyes')).toBe('AR');
    expect(buildInitials('', '')).toBe('?');
    expect(buildFullName(' Ana ', 'Reyes ')).toBe('Ana Reyes');
    expect(buildGreeting(new Date(2026, 10, 24, 9))).toBe('Good morning,');
    expect(buildGreeting(new Date(2026, 10, 24, 13))).toBe('Good afternoon,');
    expect(buildGreeting(new Date(2026, 10, 24, 19))).toBe('Good evening,');
  });
});

describe('account error messages', () => {
  it('speaks to the person by code, and says nothing for a cancel', () => {
    expect(describeAccountError(new ApiError(401, 'invalid_credentials', 'x'))).toBe('That email or password is not right.');
    expect(describeAccountError(new ApiError(422, 'validation_failed', 'x', { email: ['Use a real email.'] }))).toBe('Use a real email.');
    expect(describeAccountError(new ApiError(500, 'server_error', 'The server said so.'))).toBe('The server said so.');
    expect(describeAccountError(new OfflineError(), 'Offline here.')).toBe('Offline here.');
    expect(describeAccountError(new RequestCancelledError())).toBeNull();
  });
});

describe('password rules', async () => {
  const { listPasswordRules, looksLikeEmail, meetsPasswordRules } = await import('../passwordRules');

  it('asks for 8 to 72 characters, and a matching confirmation when there is one', () => {
    expect(meetsPasswordRules('short')).toBe(false);
    expect(meetsPasswordRules('long enough')).toBe(true);
    expect(meetsPasswordRules('x'.repeat(73))).toBe(false);
    expect(listPasswordRules('long enough', 'long enougH').map((rule) => rule.isMet)).toEqual([true, false]);
    expect(meetsPasswordRules('long enough', 'long enough')).toBe(true);
  });

  it('spots an obviously wrong email', () => {
    expect(looksLikeEmail(' ana@example.com ')).toBe(true);
    expect(looksLikeEmail('ana@example')).toBe(false);
  });
});
