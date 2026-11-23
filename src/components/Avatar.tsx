import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { color, font } from '@/theme/theme';
import { scaled } from '@/layout/tabletScale';

/**
 * A person's picture, or their initials when there is no picture to show.
 *
 * Every avatar in the app goes through here so a profile photo appears in all
 * of them at once — and so a file that has gone missing quietly falls back to
 * the initials instead of leaving a hole.
 */
export function Avatar({
  uri,
  initials,
  size = 46,
  style,
  initialsStyle,
}: {
  uri?: string;
  initials: string;
  size?: number;
  /** Scales with the circle unless overridden. */
  style?: StyleProp<ViewStyle>;
  /**
   * The initials are not one typeface across the app — a roster row sets them
   * muted and small, a profile header sets them large and in the accent. Each
   * list keeps its own rather than being flattened into a single avatar look.
   */
  initialsStyle?: StyleProp<TextStyle>;
}) {
  // Keyed on the URI, not a bare flag: a photo that failed and was then
  // replaced must get its own chance to load rather than inherit the verdict.
  const [failedUri, setFailedUri] = useState<string | undefined>(undefined);
  const showPhoto = !!uri && uri !== failedUri;

  return (
    <View style={[styles.circle, { width: scaled(size), height: scaled(size) }, style]}>
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={{ width: scaled(size), height: scaled(size) }}
          onError={() => setFailedUri(uri)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        // The circle keeps its size at large text, so the initials can only grow
        // so far before they are clipped by it.
        <Text style={[styles.initials, { fontSize: Math.round(scaled(size) * 0.37) }, initialsStyle]} maxFontSizeMultiplier={1.4}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 999,
    backgroundColor: color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontFamily: font.eyebrow, color: color.primary },
});
