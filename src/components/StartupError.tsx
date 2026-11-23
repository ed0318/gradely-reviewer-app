import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Paper } from '@/components/Paper';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE_ON_PRIMARY } from '@/theme/press';
import { color, font, radius } from '@/theme/theme';

type StartupErrorProps = {
  message: string;
  onRetry: () => void;
};

/** Shown in place of the app when something it needs to start could not open. */
export function StartupError({ message, onRetry }: StartupErrorProps) {
  return (
    <View style={styles.root}>
      <Paper margin={18} />
      <Text style={styles.title} accessibilityRole="header">
        Gradely Reviewer could not open
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        android_ripple={RIPPLE_ON_PRIMARY}
        style={({ pressed }) => [styles.button, IOS && pressed && IOS_DIM]}
      >
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontFamily: font.title, fontSize: 22, color: color.ink, textAlign: 'center' },
  message: { fontFamily: font.uiRegular, fontSize: 14, color: color.inkMuted, textAlign: 'center' },
  button: {
    ...PRESS_CLIP,
    minHeight: 44,
    minWidth: 140,
    marginTop: 8,
    paddingHorizontal: 20,
    borderRadius: radius.field,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontFamily: font.uiBold, fontSize: 15, color: color.onPrimary },
});
