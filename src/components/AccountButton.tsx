import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { resolvePhotoUri } from '@/features/account/profilePhoto';
import { buildInitials } from '@/lib/personName';
import { useSignedInSession } from '@/state/AccountProvider';
import { Avatar } from './Avatar';

/**
 * The person's own picture at the top right of every tab: the way to Settings,
 * as in gradely-app. Settings is not a tab.
 */
export function AccountButton({ size = 40 }: { size?: number }) {
  const router = useRouter();
  const { profile } = useSignedInSession();
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={{ top: 10, left: 10, right: 10, bottom: 4 }}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
    >
      <Avatar uri={resolvePhotoUri(profile.photoPath) ?? undefined} initials={buildInitials(profile.firstName, profile.lastName)} size={size} />
    </Pressable>
  );
}
