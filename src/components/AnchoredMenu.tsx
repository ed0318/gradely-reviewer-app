import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { color, font, radius } from '@/theme/theme';

/** Where the control that opened the menu is, in window points. */
export type MenuAnchor = { x: number; y: number; width: number; height: number };

/**
 * A menu that drops down from the control that opened it — the ⋯ on a BackBar —
 * rather than a dialog in the middle of the screen. That is the menu both
 * platforms draw: iOS's pull-down from a button, Android's overflow dropdown.
 *
 * `ref` goes on a View around the control (with `collapsable={false}`, so
 * Android keeps it to measure); `open()` measures it and shows the menu there.
 */
export function useMenuAnchor() {
  const ref = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const open = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  }, []);
  const close = useCallback(() => setAnchor(null), []);
  return { ref, anchor, open, close };
}

const GAP = 6;
const EDGE = 12;
const WIDTH = 300;

export function AnchoredMenu({
  anchor,
  title,
  onClose,
  width = WIDTH,
  children,
}: {
  /** Null keeps the menu closed. */
  anchor: MenuAnchor | null;
  title?: string;
  onClose: () => void;
  /** How wide the menu is, at most; a short menu of a few words needs less. */
  width?: number;
  children: React.ReactNode;
}) {
  return (
    // Translucent bars: the menu is placed in window points, so the modal has to
    // start at the top of the window too, not under Android's status bar.
    //
    // No modal animation: a menu item that opens a screen pushes it as the menu
    // closes, and iOS held that push back until a fading modal had finished
    // going — about a second of nothing after the tap. The backdrop fades in on
    // its own instead, and the menu goes at once.
    <Modal visible={anchor != null} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(120)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable accessible={false} style={styles.backdrop} onPress={onClose} />
      </Animated.View>
      {/* Keyed by where it opened, so each opening measures itself afresh. */}
      {anchor && (
        <MenuCard key={`${anchor.x},${anchor.y}`} anchor={anchor} title={title} width={width}>
          {children}
        </MenuCard>
      )}
    </Modal>
  );
}

/**
 * The menu itself. It drops below the control, unless there is not room for
 * it there and there is above — a control near the bottom of a list — in which
 * case it opens upward. Its height is measured once, hidden, before it is
 * placed, so it never flashes in the wrong spot.
 */
function MenuCard({ anchor, title, width, children }: { anchor: MenuAnchor; title?: string; width: number; children: React.ReactNode }) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState<number | null>(null);

  const bottomEdge = window.height - Math.max(insets.bottom, EDGE);
  const topEdge = Math.max(insets.top, EDGE);
  const below = anchor.y + anchor.height + GAP;
  const roomBelow = bottomEdge - below;
  const roomAbove = anchor.y - GAP - topEdge;
  const up = height != null && height > roomBelow && roomAbove > roomBelow;
  // At large text the items can outgrow the room either way; they scroll.
  const maxHeight = up ? roomAbove : roomBelow;
  const top = up ? Math.max(topEdge, anchor.y - GAP - Math.min(height ?? 0, roomAbove)) : below;
  // Its right edge lines up with the control's, so it reads as coming out of it.
  const right = Math.max(EDGE, window.width - (anchor.x + anchor.width));

  return (
    // A plain View: on Android a layout animation on the card kept it at the
    // opacity it was measured at (0), so the menu never appeared.
    <View
      style={[
        styles.card,
        height == null
          ? { top: 0, right, opacity: 0 }
          : { top, right, maxHeight },
        { width: Math.min(width, window.width - EDGE * 2) },
      ]}
      onLayout={(e) => {
        if (height == null) setHeight(e.nativeEvent.layout.height);
      }}
      accessibilityRole="menu"
    >
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lighter than a dialog's: the page stays readable behind a menu.
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23, 34, 51, 0.12)' },
  card: {
    position: 'absolute',
    backgroundColor: color.sheet,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
    paddingTop: 2,
    elevation: 8,
    shadowColor: color.ink,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, paddingHorizontal: 16, paddingVertical: 10 },
});
