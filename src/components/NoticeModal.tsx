import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon, type IconName } from './Icon';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE } from '@/theme/press';

/**
 * Something that has happened, with one way out of it.
 *
 * Not an `Alert`. A native alert is dropped whenever another modal is tearing
 * down or the screen under it is being swapped out, and both of those are
 * exactly what is going on at the end of a destructive flow — which is how
 * "delete my account" came to look like a dead button on Android: the account
 * really was deleted, and nothing ever said so. This is drawn by the app, so it
 * cannot be dropped by the platform.
 *
 * It has no backdrop tap and no close cross on purpose. The button is not an
 * acknowledgement of a message; it is the next step of the flow — the sign-out
 * after an account is gone — and there must be no way past it that skips that.
 */
export function NoticeModal({
  visible,
  icon = 'check',
  tone = 'primary',
  title,
  body,
  actionLabel,
  onAction,
}: {
  visible: boolean;
  icon?: IconName;
  /** `primary` for something that worked, `danger` for something that did not. */
  tone?: 'primary' | 'danger';
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const accent = tone === 'danger' ? color.rust : color.primary;
  const wash = tone === 'danger' ? color.rustTint : color.primaryTint;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: wash }]}>
            <Icon name={icon} size={24} color={accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable
            android_ripple={RIPPLE}
            style={({ pressed }) => [styles.action, { backgroundColor: accent }, PRESS_CLIP, IOS && pressed && IOS_DIM]}
            onPress={onAction}
            accessibilityRole="button"
          >
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 34, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: color.sheet,
    borderRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  badge: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: font.sheetTitle,
    fontSize: 19,
    letterSpacing: -0.3,
    color: color.ink,
    textAlign: 'center',
    marginTop: 14,
  },
  body: {
    fontFamily: font.uiRegular,
    fontSize: 13,
    lineHeight: 19,
    color: color.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  action: {
    height: 46,
    alignSelf: 'stretch',
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionLabel: { fontFamily: font.ui, fontSize: 14, color: color.onPrimary },
});
