import React, { createContext, useContext } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color } from '@/theme/theme';
import { COLUMN_MAX, TABLET_INSET, useLayout, useSystemInsets } from '@/layout/useLayout';
import { RenderProbe } from '@/lib/perfLog';
import { Paper } from './Paper';

/**
 * True under the tabs layout, which provides it. A context rather than
 * `useSegments()`, which re-rendered every mounted screen on every navigation
 * just to answer a question whose answer never changes for a screen.
 */
export const InTabs = createContext(false);

/**
 * The shell every screen sits in.
 *
 * On a phone it is the whole window. On a tablet it is the whole window too,
 * with a little more room at the sides, and only a wide landscape window holds
 * the content to a centred column (`COLUMN_MAX`).
 *
 * `form` (the default) is the reading width: settings, editors, anything a
 * teacher fills in. `page` is the wide one, for the screens that lay their
 * content out in a grid and need the room for it.
 *
 * The column is made with side padding, not with a narrower box. A bottom sheet
 * or a backdrop is absolutely positioned against this view, and an absolute
 * child ignores its parent's padding: so ordinary content stays in the column
 * while a sheet and its dimmed backdrop still cover the whole window, which is
 * what the eye expects of one.
 *
 * Screens pushed over the tabs also keep clear of Android's navigation bar. The
 * app draws edge to edge, so a footer button at the bottom of a pushed screen
 * (New class, Save) sat underneath the bar and the touch went to the system.
 * The tab screens are left alone: their tab bar already pads for it.
 *
 * Every screen is written on ruled paper (see `Paper`). The margin line sits
 * just inside the column, so on a tablet it follows the column in from the edge.
 */
export function Screen({
  children,
  style,
  width = 'form',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  width?: keyof typeof COLUMN_MAX;
}) {
  const { width: window, tablet } = useLayout();
  const inTabs = useContext(InTabs);
  const { bottom } = useSystemInsets();
  const side = Math.max(tablet ? TABLET_INSET : 0, Math.floor((window - COLUMN_MAX[width]) / 2));
  // When the system text size changes, the screen is built again. React Native
  // re-measures the text in its own copy of the screen, but the next render
  // lays out from React's copy, whose sizes are still the old ones: the text
  // drew at the new size inside boxes cut for the old one ("New class" in a
  // pill twice its height, "9 — Section…" cut short) until the app restarted.
  // Anything mounted after the change was right, so the screen's contents are
  // keyed on the scale and mount afresh. Navigation is untouched; only what is
  // typed into a field on this screen at that moment is lost.
  const { fontScale } = useWindowDimensions();
  const body = (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'left', 'right']}>
      <View key={fontScale} style={[styles.column, { paddingHorizontal: side, paddingBottom: inTabs ? 0 : bottom }]}>
        <Paper margin={side + 10} />
        {children}
      </View>
    </SafeAreaView>
  );
  // Dev-only: every screen's commits are counted for the [render] line.
  return __DEV__ ? <RenderProbe>{body}</RenderProbe> : body;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  column: { flex: 1, backgroundColor: color.canvas },
});
