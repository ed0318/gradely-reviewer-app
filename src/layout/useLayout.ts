import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_TABLET } from './tabletScale';

/**
 * How wide the window is, in the terms the screens care about.
 *
 * Measured from the window, not the device: an iPad in Split View or Slide Over
 * is as narrow as a phone and should lay out like one, and a phone turned on its
 * side should not be mistaken for a tablet. Nothing here asks what the hardware
 * is — only how much room there is right now.
 */
export const BREAKPOINT = {
  /** From here a screen has room for a second column. An iPad in portrait is 744–834 wide. */
  tablet: 700,
  /** From here it has room for a third. An iPad in landscape is 1024 or more. */
  wide: 1000,
} as const;

/**
 * The widest the one column gets.
 *
 * On a tablet the app fills the screen the way a normal tablet app does: an
 * iPad in portrait (744–1032 wide) gets the whole width, and only a landscape
 * window stops short. It was held to a 640-point strip down the middle once,
 * which read as a phone app floating on an iPad — the user asked for normal
 * size. It is still one column (see the tablet notes): wider, not gridded.
 */
export const COLUMN_MAX = { form: 1120, page: 1120 } as const;

/**
 * The system font scale past which a layout reflows for large text (about
 * 135%): a row's value goes under its title, a header's buttons under its
 * heading. Compared with `useWindowDimensions().fontScale`.
 */
export const LARGE_TEXT = 1.3;

/** Extra side room on a tablet, on top of each screen's own gutter, so a full-width column still breathes. */
export const TABLET_INSET = 20;

/** The widest a bottom sheet gets. Full-width on a phone, a centred panel on a tablet. */
export const SHEET_MAX = 560;

export type Layout = {
  width: number;
  height: number;
  /** Room for two columns. */
  tablet: boolean;
  /** Room for three. */
  wide: boolean;
  /** How many cards fit across a grid. */
  columns: 1 | 2 | 3;
  /** Side padding that lines a sheet or dialog up with the centred column. */
  sheetInset: (maxWidth: number) => number;
};

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const tablet = width >= BREAKPOINT.tablet;
  const wide = width >= BREAKPOINT.wide;
  return {
    width,
    height,
    tablet,
    wide,
    columns: wide ? 3 : tablet ? 2 : 1,
    // Half of whatever the window has beyond the given width, never negative.
    sheetInset: (maxWidth) => Math.max(0, Math.floor((width - maxWidth) / 2)),
  };
}

/**
 * The frame the sign-in screens sit in. A form wants a narrower column than the
 * gradebook does: on an iPad a login field a thousand points wide is a long way
 * from the button under it.
 */
export const AUTH_FRAME = { flex: 1, width: '100%', maxWidth: IS_TABLET ? 620 : 460 } as const;

/**
 * Setup after sign-in: five steps with pickers and lists rather than two
 * fields, so on a tablet it gets more room than the sign-in column.
 */
export const SETUP_FRAME = { flex: 1, width: '100%', maxWidth: IS_TABLET ? 800 : 460 } as const;

/**
 * How far the system's own bars reach into the window, for screens that draw
 * their own edges instead of sitting in `Screen`.
 *
 * The bottom is Android only. iOS footers already leave 30 points for the home
 * indicator, but Android draws edge to edge under a navigation bar of up to 48
 * dp (three buttons) or a gesture strip, and a button that sits there cannot
 * be tapped: the system takes the touch.
 */
export function useSystemInsets() {
  const insets = useSafeAreaInsets();
  return { top: insets.top, bottom: Platform.OS === 'android' ? insets.bottom : 0 };
}
