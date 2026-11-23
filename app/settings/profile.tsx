import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { BackBar } from '@/components/BackBar';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { NoticeModal } from '@/components/NoticeModal';
import { Screen } from '@/components/Screen';
import { useProfileEditor } from '@/features/account/hooks/useProfileEditor';
import { buildFullName, buildInitials } from '@/lib/personName';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE, RIPPLE_ON_PRIMARY } from '@/theme/press';
import { color, font, radius, space } from '@/theme/theme';

/** gradely-app's profile screen: picture, name, the locked email, and Delete account. */
export default function ProfileScreen() {
  const router = useRouter();
  const editor = useProfileEditor();
  const fullName = buildFullName(editor.firstName, editor.lastName);

  return (
    <Screen>
      <BackBar label="Settings" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>Your profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card style={styles.previewCard}>
            <Pressable onPress={editor.openPhotoMenu} accessibilityRole="button" accessibilityLabel={editor.hasPhoto ? 'Change profile picture' : 'Add a profile picture'}>
              <Avatar uri={editor.photoUri ?? undefined} initials={buildInitials(editor.firstName, editor.lastName)} size={62} />
              <View style={styles.avatarBadge}>
                <Icon name="camera" size={13} color={color.onPrimary} />
              </View>
            </Pressable>
            <View style={styles.previewText}>
              <Text style={styles.previewName} numberOfLines={1}>
                {fullName || 'Your name'}
              </Text>
              <Text style={styles.previewMeta} numberOfLines={1}>
                Picture saved on this phone only
              </Text>
              <Pressable android_ripple={RIPPLE} style={({ pressed }) => [PRESS_CLIP, IOS && pressed && IOS_DIM]} accessibilityRole="button" hitSlop={6} onPress={editor.openPhotoMenu}>
                <Text style={styles.photoAction}>{editor.hasPhoto ? 'Change picture' : 'Add a picture'}</Text>
              </Pressable>
            </View>
          </Card>

          <Text style={styles.label}>FIRST NAME</Text>
          <TextInput value={editor.firstName} onChangeText={editor.setFirstName} autoCorrect={false} placeholder="First name" placeholderTextColor={color.inkMuted} accessibilityLabel="First name" style={styles.input} />
          <Text style={[styles.label, styles.spaced]}>LAST NAME</Text>
          <TextInput value={editor.lastName} onChangeText={editor.setLastName} autoCorrect={false} placeholder="Last name" placeholderTextColor={color.inkMuted} accessibilityLabel="Last name" style={styles.input} />

          <Text style={[styles.label, styles.spaced]}>EMAIL</Text>
          <View style={[styles.input, styles.readOnly]}>
            <Text style={styles.readOnlyValue} numberOfLines={1}>
              {editor.email}
            </Text>
            <Icon name="lock" size={16} color={color.chevron} />
          </View>
          <Text style={styles.hint}>Your email is the account you signed in with, so it cannot be changed here.</Text>

          <Text style={styles.dangerEyebrow}>DELETE ACCOUNT</Text>
          <Text style={styles.dangerNote}>
            Deleting your account removes it permanently, with any credits left. Your topics, questions, exams and everything else Gradely Reviewer keeps on this
            phone are erased too.
          </Text>
          <Pressable
            android_ripple={RIPPLE}
            style={({ pressed }) => [styles.danger, editor.isDeleting && { opacity: 0.5 }, PRESS_CLIP, IOS && pressed && IOS_DIM]}
            accessibilityRole="button"
            disabled={editor.isDeleting}
            onPress={editor.confirmDeleteAccount}
          >
            <Text style={styles.dangerLabel}>{editor.isDeleting ? 'Deleting…' : 'Delete my account'}</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            android_ripple={RIPPLE_ON_PRIMARY}
            style={({ pressed }) => [styles.save, !editor.canSave && { opacity: 0.45 }, PRESS_CLIP, IOS && pressed && IOS_DIM]}
            accessibilityRole="button"
            disabled={!editor.canSave}
            onPress={editor.save}
          >
            <Text style={styles.saveLabel}>{editor.isSaving ? 'Saving…' : editor.isSaved && !editor.isDirty ? 'Saved' : 'Save changes'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={router.back} style={styles.discard}>
            <Text style={styles.discardLabel}>{editor.isDirty ? 'Discard and go back' : 'Back to Settings'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {editor.confirmModal}
      <NoticeModal
        visible={editor.isDeleted}
        title="Account deleted"
        body={`${editor.email} is gone. Your topics and everything else on this phone will be erased when you log out.`}
        actionLabel="Log out"
        onAction={editor.finishDeletion}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 14 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted },
  title: { fontFamily: font.title, fontSize: 30, letterSpacing: -0.6, color: color.ink, marginTop: 4 },
  content: { paddingHorizontal: space.gutter, paddingBottom: 32 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginBottom: space.section },
  avatarBadge: {
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
  previewText: { flex: 1, minWidth: 0 },
  previewName: { fontFamily: font.rowTitle, fontSize: 17, color: color.ink },
  previewMeta: { fontFamily: font.rowSubtitle, fontSize: 12, color: color.inkMuted, marginTop: 2 },
  photoAction: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary, marginTop: 8 },
  label: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginBottom: 8 },
  spaced: { marginTop: 20 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
    fontFamily: font.uiRegular,
    fontSize: 15,
    color: color.ink,
  },
  readOnly: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.field },
  readOnlyValue: { flex: 1, fontFamily: font.uiRegular, fontSize: 15, color: color.inkMuted },
  hint: { fontFamily: font.uiRegular, fontSize: 12, lineHeight: 18, color: color.inkMuted, marginTop: 8 },
  dangerEyebrow: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.rust, marginTop: 32 },
  dangerNote: { fontFamily: font.uiRegular, fontSize: 13, lineHeight: 19, color: color.inkMuted, marginTop: 8 },
  danger: { height: 50, borderRadius: radius.card, backgroundColor: color.rustTint, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  dangerLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.rust },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 16, gap: 10 },
  save: { height: 54, borderRadius: radius.field, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontFamily: font.eyebrow, fontSize: 15, color: color.onPrimary },
  discard: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  discardLabel: { fontFamily: font.ui, fontSize: 13, color: color.inkMuted },
});
