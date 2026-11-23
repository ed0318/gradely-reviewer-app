import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { AuthBrandHeader } from '@/features/account/components/AuthBrandHeader';
import { AuthField } from '@/features/account/components/AuthField';
import { AuthModeTabs } from '@/features/account/components/AuthModeTabs';
import { LegalNote } from '@/features/account/components/LegalNote';
import { PasswordRuleList } from '@/features/account/components/PasswordRuleList';
import { ProviderButtons } from '@/features/account/components/ProviderButtons';
import { useAuthForm } from '@/features/account/hooks/useAuthForm';
import { color, font } from '@/theme/theme';

/** gradely-app's sign-in: Log in and Create account on one screen, then Apple and Google. */
export default function SignInScreen() {
  const router = useRouter();
  const form = useAuthForm();
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const isBusy = form.busyMethod !== null;

  return (
    <AuthScreen contentTopPadding={64}>
      <AuthBrandHeader />
      <View style={styles.tabs}>
        <AuthModeTabs mode={form.mode} onChange={form.switchMode} isDisabled={isBusy} />
      </View>

      <View style={styles.fields}>
        <AuthField
          icon="mail"
          label="Email address"
          value={form.fields.email}
          onChangeText={form.setEmail}
          editable={!isBusy}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AuthField
          ref={passwordRef}
          icon="lock"
          label={form.isSignup ? 'Create a password' : 'Password'}
          isSecret
          value={form.fields.password}
          onChangeText={form.setPassword}
          editable={!isBusy}
          autoCapitalize="none"
          autoComplete={form.isSignup ? 'new-password' : 'current-password'}
          textContentType={form.isSignup ? 'newPassword' : 'password'}
          returnKeyType={form.isSignup ? 'next' : 'go'}
          submitBehavior={form.isSignup ? 'submit' : 'blurAndSubmit'}
          onSubmitEditing={form.isSignup ? () => confirmationRef.current?.focus() : form.submit}
        />
        {form.isSignup && (
          <AuthField
            ref={confirmationRef}
            icon="lock"
            label="Confirm password"
            isSecret
            value={form.fields.confirmation}
            onChangeText={form.setConfirmation}
            editable={!isBusy}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={form.submit}
          />
        )}
      </View>
      {form.isSignup && (
        <View style={styles.rules}>
          <PasswordRuleList rules={form.passwordRules} />
        </View>
      )}

      {form.error && (
        <View style={styles.error}>
          <FormMessage text={form.error.message} />
          {form.error.existingEmail && (
            <Pressable onPress={form.logInWithExistingEmail} hitSlop={8} accessibilityRole="button" style={styles.errorAction}>
              <Text style={styles.errorActionLabel}>Log in with this email</Text>
            </Pressable>
          )}
        </View>
      )}

      <Button
        label={form.isSignup ? (form.busyMethod === 'email' ? 'Creating account…' : 'Create account') : form.busyMethod === 'email' ? 'Logging in…' : 'Log in'}
        onPress={form.submit}
        isBusy={form.busyMethod === 'email'}
        isDisabled={!form.canSubmit}
        style={styles.submit}
      />

      <ProviderButtons
        isAppleAvailable={form.isAppleAvailable}
        isGoogleAvailable={form.isGoogleAvailable}
        busyMethod={form.busyMethod}
        onApple={form.signInWithApple}
        onGoogle={form.signInWithGoogle}
      />

      {!form.isSignup && (
        <Pressable
          disabled={isBusy}
          accessibilityRole="link"
          style={styles.forgot}
          onPress={() => router.push({ pathname: '/forgot-password', params: form.emailForReset ? { email: form.emailForReset } : {} })}
        >
          <Text style={styles.forgotLabel}>Forgot your password?</Text>
        </Pressable>
      )}
      <LegalNote />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginTop: 26 },
  fields: { marginTop: 14, gap: 10 },
  rules: { marginTop: 10 },
  error: { marginTop: 12, gap: 4 },
  errorAction: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  errorActionLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary },
  submit: { marginTop: 18, minHeight: 54 },
  forgot: { minHeight: 44, justifyContent: 'center', marginTop: 10 },
  forgotLabel: { textAlign: 'center', fontFamily: font.ui, fontSize: 13, color: color.inkMuted },
});
