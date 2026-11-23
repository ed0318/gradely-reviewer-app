import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { buildInitials } from '@/lib/personName';
import { color, font } from '@/theme/theme';

type AvatarProps = { firstName: string; lastName: string; photoUri: string | null; size?: number };

/** The profile photo, or the initials on a navy tint when there is none or it will not load. */
export function Avatar({ firstName, lastName, photoUri, size = 48 }: AvatarProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const isPhotoShown = !!photoUri && failedUri !== photoUri;
  const frame = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.frame, frame]} accessible={false}>
      {isPhotoShown ? (
        <Image source={{ uri: photoUri }} style={frame} onError={() => setFailedUri(photoUri)} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{buildInitials(firstName, lastName)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: color.primaryTint,
    borderWidth: 2,
    borderColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: color.line,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  initials: { fontFamily: font.title, color: color.primary },
});
