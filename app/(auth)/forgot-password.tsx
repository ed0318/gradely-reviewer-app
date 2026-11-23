import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { InfoNote } from '@/components/InfoNote';
import { AuthField } from '@/features/account/components/AuthField';
import { useForgotPassword } from '@/features/account/hooks/usePasswordReset';
import { color, font } from '@/theme/theme';

/** gradely-app's "Forgot your password?": the address, then a 6-digit code on the next screen. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  // `replace`: coming back here from the code would only send a second code and void the first.
  const forgot = useForgotPassword(emailParam, (email) => router.replace({ pathname: '/reset-password', params: { email } }));

  return (
    <AuthScreen
      header={<BackBar label="Log in" />}
      footer={
        <>
          <Button label="Send code" onPress={forgot.send} isBusy={forgot.isBusy} isDisabled={!forgot.canSend} />
          <Button label="Back to log in" variant="quiet" onPress={() => router.replace('/sign-in')} />
        </>
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        Forgot your password?
      </Text>
      <Text style={styles.subtitle}>Enter the email address on your account and we will send you a 6-digit code to choose a new password with.</Text>
      <View style={styles.field}>
        <AuthField
          icon="mail"
          label="Email address"
          value={forgot.email}
          onChangeText={forgot.setEmail}
          editable={!forgot.isBusy}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus={!emailParam}
          returnKeyType="send"
          onSubmitEditing={forgot.send}
        />
      </View>
      <FormMessage text={forgot.errorMessage} />
      <View style={styles.note}>
        <InfoNote text="If that address has an account, a code is on its way. The code lasts 15 minutes and can only be used once. Check your spam folder if it has not arrived." />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.title, fontSize: 32, letterSpacing: -0.6, color: color.ink },
  subtitle: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted, marginTop: 10 },
  field: { marginTop: 26, marginBottom: 12 },
  note: { marginTop: 20 },
});
