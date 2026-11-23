import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { InfoNote } from '@/components/InfoNote';
import { AuthField } from '@/features/account/components/AuthField';
import { PasswordRuleList } from '@/features/account/components/PasswordRuleList';
import { RESET_CODE_LENGTH, useResetPassword } from '@/features/account/hooks/usePasswordReset';
import { listPasswordRules } from '@/features/account/passwordRules';
import { CodeBoxes } from '@/features/handover/components/CodeBoxes';
import { color, font } from '@/theme/theme';

/** gradely-app's "Choose a new password": the emailed code in six boxes, then the new password. */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  // Not signed in afterwards: proving you can read the mailbox changes the password, then you sign in with it.
  const reset = useResetPassword(email, () =>
    Alert.alert('Password changed', 'Sign in with your new password.', [{ text: 'OK', onPress: () => router.replace('/sign-in') }]),
  );

  return (
    <AuthScreen
      header={<BackBar label="Log in" onPress={() => router.replace('/sign-in')} />}
      footer={
        <>
          <Button label="Change password" onPress={reset.submit} isBusy={reset.isBusy} isDisabled={!reset.canSubmit} />
          <Button label="Back to log in" variant="quiet" onPress={() => router.replace('/sign-in')} />
        </>
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        Choose a new password
      </Text>
      <Text style={styles.subtitle}>
        {email ? `If ${email} has an account, we sent it a 6-digit code. Enter it below with your new password.` : 'Enter the 6-digit code we emailed you, with your new password.'}
      </Text>
      <View style={styles.code}>
        <CodeBoxes value={reset.code} length={RESET_CODE_LENGTH} onChangeText={reset.setCode} isEditable={!reset.isBusy} />
      </View>
      <View style={styles.field}>
        <AuthField
          icon="lock"
          label="New password"
          isSecret
          value={reset.password}
          onChangeText={reset.setPassword}
          editable={!reset.isBusy}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </View>
      <PasswordRuleList rules={listPasswordRules(reset.password)} />
      <FormMessage text={reset.errorMessage} />
      <View style={styles.note}>
        <InfoNote text="A code lasts 15 minutes and can only be used once. Check your spam folder if it has not arrived." />
      </View>
      {reset.note && <Text style={styles.sentNote}>{reset.note}</Text>}
      <Pressable accessibilityRole="button" onPress={reset.resend} disabled={reset.isResending || reset.isBusy} style={styles.resend}>
        {reset.isResending && <ActivityIndicator size="small" color={color.primary} />}
        <Text style={styles.resendLabel}>{reset.isResending ? 'Sending…' : 'Send a new code'}</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.title, fontSize: 32, letterSpacing: -0.6, color: color.ink },
  subtitle: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted, marginTop: 10 },
  code: { marginTop: 26 },
  field: { marginTop: 16, marginBottom: 10 },
  note: { marginTop: 20 },
  sentNote: { fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 18, color: color.inkMuted, marginTop: 18 },
  resend: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 8, alignSelf: 'flex-start' },
  resendLabel: { fontFamily: font.eyebrow, fontSize: 13.5, color: color.primary },
});
