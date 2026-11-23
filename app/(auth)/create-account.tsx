import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { MIN_PASSWORD_LENGTH, useCreateAccount } from '@/features/account/hooks/useCreateAccount';

export default function CreateAccountScreen() {
  const router = useRouter();
  const form = useCreateAccount();

  return (
    <PaperScreen footer={<Button label="Create account" onPress={form.submit} isBusy={form.isBusy} isDisabled={!form.canSubmit} />}>
      <ScreenHeader title="Create your account." onBack={router.back} />
      <View style={styles.names}>
        <View style={styles.half}>
          <TextField label="First name" value={form.firstName} onChangeText={form.setFirstName} autoComplete="given-name" textContentType="givenName" />
        </View>
        <View style={styles.half}>
          <TextField label="Last name" value={form.lastName} onChangeText={form.setLastName} autoComplete="family-name" textContentType="familyName" />
        </View>
      </View>
      <TextField
        label="Email"
        value={form.email}
        onChangeText={form.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={form.password}
        onChangeText={form.setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        errorMessage={form.isPasswordTooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null}
      />
      <FormMessage text={form.errorMessage} />
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  names: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});
