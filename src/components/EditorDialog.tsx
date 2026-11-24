import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE, RIPPLE_ON_PRIMARY } from '@/theme/press';

/** Shared chrome for every small create/edit sheet in Settings. */
export function EditorDialog({
  visible,
  title,
  subtitle,
  error,
  saveLabel = 'Save',
  saveDisabled,
  onSave,
  onCancel,
  onDelete,
  deleteLabel = 'Delete',
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  error?: string | null;
  saveLabel?: string;
  saveDisabled?: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessible={false} style={styles.backdrop} onPress={onCancel}>
          <Pressable accessible={false} style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable android_ripple={RIPPLE_ON_PRIMARY} style={({ pressed }) => [styles.save, saveDisabled && { opacity: 0.45 }, PRESS_CLIP, IOS && pressed && IOS_DIM]} accessibilityRole="button" disabled={saveDisabled} onPress={onSave}>
              <Text style={styles.saveLabel}>{saveLabel}</Text>
            </Pressable>
            <View style={styles.footerRow}>
              <Pressable android_ripple={RIPPLE} style={({ pressed }) => [styles.footerBtn, PRESS_CLIP, IOS && pressed && IOS_DIM]} accessibilityRole="button" onPress={onCancel}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              {onDelete && (
                <Pressable android_ripple={RIPPLE} style={({ pressed }) => [styles.footerBtn, PRESS_CLIP, IOS && pressed && IOS_DIM]} accessibilityRole="button" onPress={onDelete}>
                  <Text style={styles.delete}>{deleteLabel}</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Labelled text field used inside EditorDialog. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  mono,
  keyboardType,
  autoCapitalize,
  autoFocus,
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  /** Several lines, for a longer text such as directions. */
  multiline?: boolean;
  style?: object;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkMuted}
        multiline={multiline}
        style={[styles.input, mono && styles.mono, multiline && styles.multiline]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23, 34, 51,.42)', justifyContent: 'center', paddingHorizontal: 22 },
  dialog: { alignSelf: 'center', width: '100%', maxWidth: 520, backgroundColor: color.sheet, borderRadius: radius.sheet, padding: 22, maxHeight: '86%' },
  title: { fontFamily: font.sheetTitle, fontSize: 24, letterSpacing: -0.4, color: color.ink },
  subtitle: { fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 19, color: color.inkMuted, marginTop: 8 },
  body: { marginTop: 18, flexGrow: 0 },
  label: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginBottom: 8 },
  input: {
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.fieldBorder,
    borderRadius: radius.field,
    height: 50,
    paddingHorizontal: 16,
    fontFamily: font.uiRegular,
    fontSize: 15,
    color: color.ink,
  },
  mono: { fontFamily: font.mono, fontSize: 14.5 },
  multiline: { height: undefined, minHeight: 84, paddingTop: 14, paddingBottom: 14, lineHeight: 21, textAlignVertical: 'top' },
  error: { fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 18, color: color.rust, marginTop: 12 },
  save: { height: 52, borderRadius: radius.field, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveLabel: { fontFamily: font.eyebrow, fontSize: 15, color: color.onPrimary },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  footerBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  cancel: { fontFamily: font.ui, fontSize: 13.5, color: color.inkMuted },
  delete: { fontFamily: font.ui, fontSize: 13.5, color: color.rust },
});
