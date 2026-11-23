import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { color, font, radius } from '@/theme/theme';
import { useProfileEditor } from '../hooks/useProfileEditor';

/** Settings' profile card: photo (camera or gallery, kept on the phone), name (saved to the account), email. */
export function ProfileCard() {
  const editor = useProfileEditor();
  return (
    <View style={styles.root} accessibilityLabel="Profile">
      <View style={styles.photoRow}>
        <View>
          <Avatar firstName={editor.firstName} lastName={editor.lastName} photoUri={editor.photoUri} size={76} />
          <Pressable
            onPress={editor.choosePhotoSource}
            disabled={editor.isPhotoBusy}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.cameraButton}
          >
            {editor.isPhotoBusy ? <ActivityIndicator size="small" color={color.onPrimary} /> : <Icon name="camera" size={16} color={color.onPrimary} />}
          </Pressable>
        </View>
        <View style={styles.photoText}>
          <Button label="Upload a photo" variant="outline" onPress={editor.choosePhotoSource} isDisabled={editor.isPhotoBusy} style={styles.uploadButton} />
          <Text style={styles.hint}>Camera or gallery. Saved on this phone.</Text>
        </View>
      </View>
      <View style={styles.names}>
        <View style={styles.half}>
          <TextField label="First name" value={editor.firstName} onChangeText={editor.setFirstName} autoComplete="given-name" textContentType="givenName" />
        </View>
        <View style={styles.half}>
          <TextField label="Last name" value={editor.lastName} onChangeText={editor.setLastName} autoComplete="family-name" textContentType="familyName" />
        </View>
      </View>
      {(editor.canSaveName || editor.isSavingName) && <Button label="Save name" onPress={editor.saveName} isBusy={editor.isSavingName} />}
      <FormMessage text={editor.nameMessage?.text ?? null} tone={editor.nameMessage?.tone} />
      <View style={styles.emailRow}>
        <Icon name="lock" size={14} color={color.inkMuted} />
        <Text style={styles.email}>{editor.email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.paper },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cameraButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: color.paper,
    backgroundColor: color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { flex: 1, gap: 6, alignItems: 'flex-start' },
  uploadButton: { minHeight: 44 },
  hint: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  names: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
});
