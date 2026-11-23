import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { color, font } from '@/theme/theme';
import { Icon } from './Icon';
import { COLUMN_MAX, useLayout, useSystemInsets } from '@/layout/useLayout';

/**
 * The push, and the pull back out.
 *
 * Decelerating rather than symmetric: a panel arriving should look like it is
 * landing, not like it is being dragged at a constant speed. The exit is a
 * little quicker — getting out of the way is not something to watch.
 */
const ENTER = { duration: 280, easing: Easing.out(Easing.cubic) };
const EXIT = { duration: 220, easing: Easing.in(Easing.cubic) };

/** Long enough for the slide out to finish before the panel stops being rendered. */
const EXIT_MS = 300;

/**
 * The iOS swipe back. A drag that starts this close to a panel's left edge
 * pulls the panel with the finger; let go past `EDGE_COMMIT` of its width, or
 * flicked faster than `EDGE_FLICK`, and it goes back as the arrow would.
 */
const EDGE_WIDTH = 24;
const EDGE_COMMIT = 0.35;
const EDGE_FLICK = 600;

export type SlidePane = {
  /** Identifies the pane so a different one at the same depth animates as a change, not a redraw. */
  key: string;
  eyebrow?: string;
  title: string;
  /** Drawn under the title, e.g. how many plans the day holds. */
  subtitle?: string;
  content: React.ReactNode;
};

/**
 * A stack of panels that slide in from the right edge, one over the last.
 *
 * Why this is one `<Modal>` holding several panels rather than one modal each:
 * iOS silently drops a `<Modal>` presented over another that is still on
 * screen. A stack built out of nested modals would work in development on
 * Android and show nothing at all on an iPhone — the same trap that made
 * Delete do nothing in every editor dialog. So the modal is the stack, and
 * depth is just another animated panel inside it.
 *
 * The panels are handed in as an array: the last one is on top, popping is
 * handing back a shorter array. A panel that has been popped keeps rendering
 * until its slide out has finished, which is what `held` is for — dropping it
 * on the same frame would make it vanish rather than leave.
 *
 * Each panel takes the full width of the column the screen behind it uses, so
 * on a phone it covers the window: a plan is a page of writing, not a sidebar,
 * and a margin of dimmed backdrop would only take width away from it. Getting
 * out is the back arrow, the close cross, or the system back gesture — there is
 * no backdrop left to tap.
 */
export function SlideOver({ panes, onPop, onClose }: { panes: SlidePane[]; onPop: () => void; onClose: () => void }) {
  const open = panes.length > 0;

  // What is drawn: the live panes while the stack is open, and the last set it
  // held while it slides away.
  const held = useRef<SlidePane[]>(panes);
  if (open) held.current = panes;
  const drawn = open ? panes : held.current;

  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onPop} statusBarTranslucent>
      {/* A modal is a native root of its own, so the panels' edge swipe needs
          its own gesture root; the app's one does not reach in here. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Backdrop open={open} onPress={onClose} />
        {drawn.map((pane, i) => (
          <Panel
            key={pane.key}
            pane={pane}
            // A panel is on screen while the live stack is that deep. Everything
            // past that depth is on its way out.
            shown={open && i < panes.length}
            // Something deeper is over it, so it steps back rather than sitting
            // full-brightness behind an opaque panel and snapping into view when
            // that one leaves.
            covered={open && i < panes.length - 1}
            depth={i}
            onBack={i === 0 ? onClose : onPop}
            onClose={onClose}
          />
        ))}
      </GestureHandlerRootView>
    </Modal>
  );
}

function Backdrop({ open, onPress }: { open: boolean; onPress: () => void }) {
  // Starts transparent even when it is opening, so the first frame is the fade
  // beginning rather than the backdrop already at full strength.
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(open ? 1 : 0, open ? ENTER : EXIT);
  }, [open, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, style]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
    </Animated.View>
  );
}

function Panel({
  pane,
  shown,
  covered,
  depth,
  onBack,
  onClose,
}: {
  pane: SlidePane;
  shown: boolean;
  covered: boolean;
  depth: number;
  onBack: () => void;
  onClose: () => void;
}) {
  const { width } = useLayout();
  const { top, bottom } = useSystemInsets();

  // The full window on a phone; on anything wider, the same centred column the
  // screen behind it is drawn in, so the panel opens over the plans rather than
  // stretching to the bezel.
  const panelWidth = Math.min(width, COLUMN_MAX.form);
  const left = Math.max(0, Math.floor((width - panelWidth) / 2));

  // Where the panel sits, in points from home.
  //
  // It starts off the right edge even on the very first frame of its life, and
  // the effect below walks it in. Starting it at home when `shown` was already
  // true is what made a panel simply appear: the animation had nowhere to run
  // from, so the tap produced a jump cut instead of a sheet.
  const x = useSharedValue(panelWidth);
  // Panels behind the top one step back a fifth of their width and dim, so a
  // push reads as depth rather than as one rectangle replacing another.
  const back = covered ? -panelWidth * 0.2 : 0;
  useEffect(() => {
    x.value = withTiming(shown ? back : panelWidth, shown ? ENTER : EXIT);
  }, [shown, back, panelWidth, x]);

  // The panels look like pushed screens, so on iOS they go back the way a
  // pushed screen does: a swipe from the left edge. Only the panel on top
  // answers it. Android has its own system back gesture at that edge, which
  // `onRequestClose` already handles.
  const swipeBack = Gesture.Pan()
    .enabled(Platform.OS === 'ios' && shown && !covered)
    .hitSlop({ left: 0, width: EDGE_WIDTH })
    .activeOffsetX(10)
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      x.set(back + Math.max(0, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX > panelWidth * EDGE_COMMIT || e.velocityX > EDGE_FLICK) {
        // Going: `shown` turns false and the effect above finishes the slide
        // out from wherever the finger let go.
        scheduleOnRN(onBack);
      } else {
        x.set(withTiming(back, ENTER));
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    // Read off the step back itself, so the dimming rides the same movement in
    // both directions instead of snapping the moment `covered` flips.
    opacity: 1 - Math.min(1, Math.max(0, -x.value) / (panelWidth * 0.2)) * 0.25,
  }));

  return (
    <GestureDetector gesture={swipeBack}>
      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            left,
            paddingTop: top + 14,
            paddingBottom: bottom,
            // Each panel sits over the one before it, even while it is leaving.
            zIndex: depth + 1,
          },
          style,
        ]}
      >
        <View style={styles.head}>
          <Pressable onPress={onBack} hitSlop={10} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
            <Icon name="chevronLeft" size={22} color={color.inkMuted} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!pane.eyebrow && <Text style={styles.eyebrow}>{pane.eyebrow}</Text>}
            <Text style={styles.title} numberOfLines={2}>
              {pane.title}
            </Text>
            {!!pane.subtitle && <Text style={styles.subtitle}>{pane.subtitle}</Text>}
          </View>
          {/* At the bottom of the stack the back arrow already closes, and two
              buttons that do the same thing is one too many. Deeper in, this is
              the way out without walking back up. */}
          {depth > 0 && (
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Icon name="close" size={22} color={color.inkMuted} />
            </Pressable>
          )}
        </View>
        <View style={{ flex: 1 }}>{pane.content}</View>
      </Animated.View>
    </GestureDetector>
  );
}

/** The easing the keyboard reported, when it is one `LayoutAnimation` knows. */
const easingType = (easing?: string) =>
  (easing && easing in LayoutAnimation.Types ? easing : 'keyboard') as keyof typeof LayoutAnimation.Types;

/**
 * How much of the window the keyboard is covering, in points. Zero on Android,
 * where the window itself resizes under it.
 *
 * `KeyboardAvoidingView` is the obvious tool and is the wrong one inside a
 * panel. It works out how far down the screen it reaches from the frame its own
 * `onLayout` reports — and that frame is measured against its parent, not the
 * window. In here the parent starts below the panel's header, so it took the
 * header's height off the padding and left the footer under the keyboard by
 * exactly that much. A panel reaches the bottom of the window by construction,
 * so the keyboard's own frame is the whole answer and nothing needs measuring.
 */
export function useKeyboardInset(): number {
  const { height } = useWindowDimensions();
  const [inset, setInset] = useState(0);
  // What was last published, so a repeat of the same frame — iOS sends several
  // while a keyboard changes — does not queue another animation.
  const last = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const cover = (e: { duration?: number; easing?: string; endCoordinates: { screenY: number } }) => {
      // Measured from the keyboard's top edge rather than taken from its
      // height, so a split or floating keyboard — which is not attached to the
      // bottom — correctly covers nothing.
      const next = Math.max(0, height - e.endCoordinates.screenY);
      if (last.current === next) return;
      last.current = next;
      // Ride the keyboard's own curve rather than snapping a frame ahead of it.
      const duration = Math.max(10, e.duration ?? 250);
      LayoutAnimation.configureNext({ duration, update: { duration, type: easingType(e.easing) } });
      setInset(next);
    };
    const subs = [
      Keyboard.addListener('keyboardWillChangeFrame', cover),
      // A hide does not always come with a frame worth reading; the keyboard is
      // going, so its top edge is the bottom of the window.
      Keyboard.addListener('keyboardWillHide', (e) => cover({ ...e, endCoordinates: { screenY: height } })),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [height]);

  return inset;
}

/**
 * One panel, driven by a boolean instead of a stack — the shape a form wants.
 *
 * Most things that slide in are a single pane over the screen that opened them:
 * a couple of fields and a button. Building a one-element array for that reads
 * like ceremony, so this wraps it. It is the same machinery underneath, which
 * matters more than the convenience — a form gets the one `<Modal>` that iOS
 * will actually present, rather than a second modal of its own stacked over
 * whatever is already up.
 *
 * The children scroll; `footer` does not, so the action a form is for stays
 * where the thumb is rather than floating in the middle of a tall panel. Both
 * sit above the keyboard, so the footer rides up with the fields.
 */
export function SlidePanel({
  open,
  eyebrow,
  title,
  subtitle,
  footer,
  onClose,
  children,
}: {
  open: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const keyboard = useKeyboardInset();
  // A fixed key on purpose. A panel reopened on a different student is the same
  // panel arriving again, not a push onto a stack, and a key that changed with
  // the subject would animate it as one.
  const panes: SlidePane[] = open
    ? [
        {
          key: 'panel',
          eyebrow,
          title,
          subtitle,
          content: (
            <View style={[styles.body, { paddingBottom: keyboard }]}>
              <ScrollView
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
              {!!footer && <View style={styles.footer}>{footer}</View>}
            </View>
          ),
        },
      ]
    : [];

  // Nothing is behind a single panel, so backing out of it and closing it are
  // the same thing — including the Android system back button.
  return <SlideOver panes={panes} onPop={onClose} onClose={onClose} />;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(23, 34, 51, 0.42)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: color.sheet,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { paddingTop: 2 },
  body: { flex: 1 },
  form: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.rule },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 10, letterSpacing: 1.1, color: color.inkMuted },
  title: { fontFamily: font.sheetTitle, fontSize: 19, letterSpacing: -0.3, color: color.ink, marginTop: 3 },
  subtitle: { fontFamily: font.rowSubtitle, fontSize: 12.5, color: color.inkMuted, marginTop: 3 },
});
