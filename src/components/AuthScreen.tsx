import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paper } from '@/components/Paper';
import { color } from '@/theme/theme';

type AuthScreenProps = {
  children: React.ReactNode;
  /** Above the scroll: the back bar and progress. */
  header?: React.ReactNode;
  /** Pinned under the scroll: the screen's buttons. */
  footer?: React.ReactNode;
  contentTopPadding?: number;
};

/** gradely-app's sign-in and setup page: ruled paper, a column at most 480 pt wide, keyboard-aware. */
export function AuthScreen({ children, header, footer, contentTopPadding = 24 }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Paper />
      <View style={styles.frame}>
        {header}
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: contentTopPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: 480 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  footer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24, gap: 12 },
});
