import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { InfoNote } from '@/components/InfoNote';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { MIN_PASSWORD_LENGTH } from '@/features/account/hooks/useCreateAccount';
import { RESET_CODE_LENGTH, usePasswordReset } from '@/features/account/hooks/usePasswordReset';
import { color, font } from '@/theme/theme';

/** Forgot password: email → emailed 6-digit code and a new password → back to sign-in. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const reset = usePasswordReset();

  const footer =
    reset.step === 'email' ? (
      <Button label="Email me a code" onPress={reset.sendCode} isBusy={reset.isBusy} isDisabled={!reset.canSendCode} />
    ) : reset.step === 'code' ? (
      <Button label="Set new password" onPress={reset.resetWithCode} isBusy={reset.isBusy} isDisabled={!reset.canReset} />
    ) : (
      <Button label="Back to sign in" onPress={router.back} />
    );

  return (
    <PaperScreen footer={footer}>
      <ScreenHeader title={reset.step === 'done' ? 'Password changed.' : 'Reset your password.'} onBack={router.back} />
      {reset.step === 'email' && (
        <>
          <Text style={styles.body}>Enter the email you signed up with. If it has an account, we'll send a 6-digit code.</Text>
          <TextField
            label="Email"
            value={reset.email}
            onChangeText={reset.setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </>
      )}
      {reset.step === 'code' && (
        <>
          <Text style={styles.body}>
            If <Text style={styles.strong}>{reset.email.trim()}</Text> has an account, a code is on its way. Enter it with your new password.
          </Text>
          <TextField
            label={`${RESET_CODE_LENGTH}-digit code`}
            value={reset.code}
            onChangeText={reset.setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={RESET_CODE_LENGTH}
            isMonospace
          />
          <TextField
            label="New password"
            value={reset.newPassword}
            onChangeText={reset.setNewPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            errorMessage={reset.newPassword.length > 0 && reset.newPassword.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null}
          />
          <InfoNote icon="clock" text="A code lasts 15 minutes and works once." />
        </>
      )}
      {reset.step === 'done' && <Text style={styles.body}>Sign in with your new password.</Text>}
      <FormMessage text={reset.errorMessage} />
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted },
  strong: { fontFamily: font.rowTitle, color: color.ink },
});
