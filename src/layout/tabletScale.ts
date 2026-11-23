import { Dimensions, StyleSheet } from 'react-native';

/**
 * Tablets get a bigger app: larger type, and more room around it.
 *
 * Every size in the app is written for a phone — 15-point text, 16-point
 * padding — and on an iPad that read as a phone app blown up to a big screen
 * with the print left small. The user asked for "normal size" there: the same
 * app, just bigger.
 *
 * Rather than touch the six hundred-odd font sizes and paddings one by one,
 * `StyleSheet.create` is wrapped once, here, before any screen defines its
 * styles, and on a tablet it multiplies type by `TABLET_FONT_SCALE` and the
 * spacing keys below by `TABLET_SCALE`.
 * Margins scale with padding on purpose: the app uses negative margins to
 * cancel a card's padding for a full-bleed row, and the two only cancel if
 * they grow together. Widths and heights are otherwise left alone — a square
 * avatar or a 4-point progress bar is a shape, not a size of text.
 *
 * Decided once, at start-up, from the screen's shorter side, so a phone turned
 * sideways is never mistaken for a tablet and nothing re-lays out mid-session.
 * Sizes a component computes at render time (a grade's font size, an icon)
 * are not in a stylesheet — those go through `scaled()` themselves.
 *
 * This must be imported before anything else creates a stylesheet, which is why
 * it is the first line of `index.js`.
 */
const { width, height } = Dimensions.get('window');
export const IS_TABLET = Math.min(width, height) >= 600;
/** Room: padding, margins, gaps, row heights, icons. */
export const TABLET_SCALE = IS_TABLET ? 1.2 : 1;
/**
 * Type, set larger than the room around it. At the same 1.2 the text still
 * read as small on an iPad held at arm's length, and the user asked for it
 * bigger again.
 */
export const TABLET_FONT_SCALE = IS_TABLET ? 1.6 : 1;

/**
 * Controls: a button, a field, a pill, an icon button — anything whose fixed
 * height sits between `CONTROL_MIN` and `CONTROL_MAX`. With the type at 1.6
 * they have to grow too, or a label ends up pressed against its edges.
 */
export const TABLET_CONTROL_SCALE = IS_TABLET ? 1.3 : 1;
const CONTROL_MIN = 24;
const CONTROL_MAX = 72;

const round = (n: number) => Math.round(n * 2) / 2;

/** A control height (a button, a field) for this device, for the few set inline. */
export function scaledControl(n: number): number {
  return TABLET_CONTROL_SCALE === 1 ? n : round(n * TABLET_CONTROL_SCALE);
}

/** A size for this device: itself on a phone, a fifth bigger on a tablet. */
export function scaled(n: number): number {
  return TABLET_SCALE === 1 ? n : round(n * TABLET_SCALE);
}

/** A font size (or a box sized to its text) for this device. */
export function scaledFont(n: number): number {
  return TABLET_FONT_SCALE === 1 ? n : round(n * TABLET_FONT_SCALE);
}

/** Scaled with the type. */
const FONT_KEYS = new Set(['fontSize', 'lineHeight']);

/** Scaled with the room. */
const SCALED_KEYS = new Set([
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingEnd',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginEnd',
  'gap',
  'rowGap',
  'columnGap',
  'minHeight',
]);

function scaleStyle(style: Record<string, unknown>) {
  // A style with its own font size and a fixed width is a box measured to fit
  // its text — a "13:00" column, a percentage — so it has to grow with the
  // text, or the text wraps inside it.
  const textBox = typeof style.fontSize === 'number';
  // A fixed height in control range is a button or a field. A fixed width
  // beside it (an icon button, an avatar, a check circle) grows with it so the
  // shape holds; a hairline or a progress bar is below the range and stays.
  const h = style.height;
  const control = typeof h === 'number' && h >= CONTROL_MIN && h <= CONTROL_MAX;
  const grow = (n: number) => round(n * TABLET_CONTROL_SCALE);
  const out: Record<string, unknown> = {};
  for (const key in style) {
    const value = style[key];
    if (typeof value !== 'number') {
      out[key] = value;
    } else if (control && (key === 'height' || (!textBox && (key === 'width' || key === 'minWidth')))) {
      out[key] = grow(value);
    } else if (control && key === 'borderRadius' && typeof h === 'number' && value >= h / 2 - 1) {
      // A circle or a full pill stays one.
      out[key] = grow(value);
    } else if (FONT_KEYS.has(key) || (textBox && (key === 'width' || key === 'minWidth'))) {
      out[key] = scaledFont(value);
    } else if (SCALED_KEYS.has(key)) {
      out[key] = scaled(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

if (IS_TABLET) {
  const create = StyleSheet.create;
  StyleSheet.create = ((styles: Record<string, Record<string, unknown>>) => {
    const out: Record<string, Record<string, unknown>> = {};
    for (const name in styles) {
      const style = styles[name];
      out[name] = style && typeof style === 'object' ? scaleStyle(style) : style;
    }
    return create(out as any);
  }) as typeof StyleSheet.create;
}
