import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { InfoNote } from '@/components/InfoNote';
import { buildInitials } from '@/lib/personName';
import { color, font, radius } from '@/theme/theme';
import type { useOnboarding } from '../../hooks/useOnboarding';
import { onboardingStyles } from './onboardingStyles';

/** Step 1: "First, who's reviewing?": an optional photo and the name. */
export function OnboardingWhoStep({ onboarding }: { onboarding: ReturnType<typeof useOnboarding> }) {
  return (
    <>
      <Text style={onboardingStyles.title} accessibilityRole="header">
        First, who's reviewing?
      </Text>
      <Text style={onboardingStyles.subtitle}>This is the name on your account{onboarding.email ? ` for ${onboarding.email}` : ''}.</Text>

      <Pressable
        onPress={onboarding.openPhotoMenu}
        accessibilityRole="button"
        accessibilityLabel={onboarding.hasPhoto ? 'Change profile picture' : 'Add a profile picture'}
        style={styles.photoRow}
      >
        <View>
          <Avatar uri={onboarding.photoUri ?? undefined} initials={buildInitials(onboarding.firstName, onboarding.lastName)} size={72} />
          <View style={styles.badge}>
            <Icon name="camera" size={13} color={color.onPrimary} />
          </View>
        </View>
        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>{onboarding.hasPhoto ? 'Change picture' : 'Add a picture'}</Text>
          <Text style={styles.photoHint}>Optional. It stays on this phone and you can change it any time.</Text>
        </View>
      </Pressable>

      <Text style={[onboardingStyles.label, styles.firstLabel]}>FIRST NAME</Text>
      <TextInput
        value={onboarding.firstName}
        onChangeText={onboarding.setFirstName}
        placeholder="First name"
        placeholderTextColor={color.inkMuted}
        accessibilityLabel="First name"
        autoComplete="given-name"
        textContentType="givenName"
        autoFocus={!onboarding.firstName}
        style={onboardingStyles.input}
      />
      <Text style={[onboardingStyles.label, onboardingStyles.spacedTop]}>LAST NAME</Text>
      <TextInput
        value={onboarding.lastName}
        onChangeText={onboarding.setLastName}
        placeholder="Last name"
        placeholderTextColor={color.inkMuted}
        accessibilityLabel="Last name"
        autoComplete="family-name"
        textContentType="familyName"
        style={onboardingStyles.input}
      />

      <View style={onboardingStyles.noteTop}>
        <InfoNote text="Your name is saved to your account, so you are still you on another phone. Your topics, questions and exams stay on this phone." />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.surface,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { flex: 1, minWidth: 0 },
  photoTitle: { fontFamily: font.rowTitle, fontSize: 15, color: color.primary },
  photoHint: { fontFamily: font.rowSubtitle, fontSize: 12, lineHeight: 17, color: color.inkMuted, marginTop: 3 },
  firstLabel: { marginTop: 24 },
});
