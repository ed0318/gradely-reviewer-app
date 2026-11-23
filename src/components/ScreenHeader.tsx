import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { color, font, space } from '@/theme/theme';
import { AccountButton } from './AccountButton';
import { CreditsButton } from './CreditsButton';
import { LARGE_TEXT } from '@/layout/useLayout';

export function ScreenHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  // At large text the buttons go under the title rather than beside it: beside
  // "New class" the title had a third of the width and broke as "Class / es".
  const large = useWindowDimensions().fontScale > LARGE_TEXT;
  // The eyebrow spans the whole header rather than sharing the title's column:
  // beside two pills that column is narrow, and "2026-2027 · QUARTER 1 · 4
  // CLASSES" broke over two lines. One line always; it shrinks a little before
  // it would cut anything off.
  //
  // The teacher's picture (the way to Settings) shares the eyebrow's line, not
  // the title's: beside "Import" and "New class" there was no room left for it.
  //
  // The header is a section of its own, a white band ruled off from the page
  // below it (Ed, 2026-10-04: "like Facebook"), with a gap before the content.
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={[styles.eyebrow, { flex: 1, minWidth: 0 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {eyebrow}
        </Text>
        {/* The balance, on every tab, where gradely-app has its bell. */}
        <CreditsButton />
        <AccountButton />
      </View>
      <View style={[styles.row, large && styles.rowStacked]}>
        {/* One line always: beside Import and New plan, "Lesson plans" broke over
            two. It shrinks a little first, as the eyebrow does. */}
        <Text
          style={[styles.title, !large && { flex: 1, minWidth: 0 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {title}
        </Text>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.gutter,
    paddingTop: 8,
    paddingBottom: 14,
    marginBottom: 12,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    // Clear of the picture above: its touch area and the buttons' must not meet.
    marginTop: 12,
  },
  rowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  eyebrow: {
    fontFamily: font.eyebrow,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: color.inkMuted,
  },
  title: {
    fontFamily: font.title,
    fontSize: 30,
    letterSpacing: -0.6,
    color: color.ink,
  },
});
