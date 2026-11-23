import { Platform } from 'react-native';

/**
 * The Gradely look, copied from gradely-app so screens and fixes move between the two.
 *
 * White paper with pale-blue ledger lines, a red margin, and the logo's navy for
 * everything that acts. Red is kept for what needs the student's attention, and
 * the handwritten face (`font.hand`) only ever carries a remark — never a label
 * or a button.
 *
 * The token names predate this look and are kept, so every screen that reads
 * `color.surface` or `color.rule` picked it up without being touched.
 */
export const color = {
  /** The page. */
  canvas: '#FFFFFF',
  /** Cards and rows sit on the page as ruled boxes, so they are white too. */
  surface: '#FFFFFF',
  /** Sheets and dialogs. */
  sheet: '#FFFFFF',
  /** Header rows, input fills, tracks. */
  paper: '#F2F5F9',
  ink: '#172233',
  inkMuted: '#565E6C',
  /** Hairline dividers inside a card, and light fills. */
  rule: '#E4EBF3',
  /** Input and control fills. */
  field: '#F2F5F9',
  /** The ledger line: every card, table and divider. */
  line: '#D0DAE6',
  /**
   * The edge of a text field or a picker that looks like one. The ledger line
   * is 1.4:1 on white, too faint to show where a field is; this is 3.6:1
   * (3.3:1 against the field fill), past the 3:1 WCAG asks of a control.
   */
  fieldBorder: '#7E8897',
  /** The faint ruling behind a page. */
  ruling: '#E4EBF3',
  /** The red margin line down the left of the page. */
  margin: '#B0352B',
  primary: '#123A63',
  onPrimary: '#FFFFFF',
  primaryTint: '#E6EDF5',
  onNavyMuted: '#9EBEDE',
  clay: '#8A5A12',
  clayTint: '#FBF6EA',
  rust: '#B0352B',
  rustTint: '#F9ECEA',
  /** Body text on a red-tinted card: a warning's words, 6.2:1 on `rustTint`. */
  dangerInk: '#8A4436',
  /** A destructive button that cannot be pressed yet. */
  dangerTintOff: '#EFD3CF',
  /** Its label: 3.7:1 on `dangerTintOff`, readable but plainly not ready. */
  dangerInkOff: '#A0584A',
  /** "Saved": the one green in the book, 6.4:1 on white. */
  ok: '#2F6B3A',
  /** Disclosure chevrons: 3.3:1 on white, the 3:1 WCAG asks of a control's mark. */
  chevron: '#848E9C',
  overlayDivider: '#D0DAE6',
  /** A highlighter pass over the row being worked on. */
  highlight: '#FFF0A6',
  /** Android's press ripple on white and on the page. */
  ripple: 'rgba(18, 58, 99, 0.12)',
  /** The same on navy. */
  rippleOnPrimary: 'rgba(255, 255, 255, 0.24)',
} as const;

export const radius = { card: 8, field: 6, sheet: 16, pill: 999, tile: 8 } as const;

export const space = { gutter: 20, gap: 12, section: 22 } as const;

/**
 * A face built into the app by expo-font's config plugin (app.json), so it is
 * there before the first frame and nothing waits on loading it. The two
 * platforms name an embedded font differently: Android by its file name
 * (`ZillaSlab_700Bold.ttf` → `ZillaSlab_700Bold`), iOS by the PostScript name
 * inside the file (`ZillaSlab-Bold`). Each token carries both.
 */
const face = (file: string, postScript: string) => (Platform.OS === 'ios' ? postScript : file);

export const font = {
  /** The logo's wordmark. Nothing else is set in it. */
  brand: face('BricolageGrotesque_600SemiBold', 'BricolageGrotesque-SemiBold'),
  title: face('ZillaSlab_700Bold', 'ZillaSlab-Bold'),
  sheetTitle: face('ZillaSlab_700Bold', 'ZillaSlab-Bold'),
  heading: face('ZillaSlab_600SemiBold', 'ZillaSlab-SemiBold'),
  rowTitle: face('PublicSans_600SemiBold', 'PublicSans-SemiBold'),
  rowSubtitle: face('PublicSans_400Regular', 'PublicSans-Regular'),
  eyebrow: face('PublicSans_600SemiBold', 'PublicSans-SemiBold'),
  mono: face('JetBrainsMono_500Medium', 'JetBrainsMono-Medium'),
  monoStrong: face('JetBrainsMono_600SemiBold', 'JetBrainsMono-SemiBold'),
  ui: face('PublicSans_500Medium', 'PublicSans-Medium'),
  uiRegular: face('PublicSans_400Regular', 'PublicSans-Regular'),
  uiItalic: face('PublicSans_400Regular_Italic', 'PublicSans-Italic'),
  uiBold: face('PublicSans_700Bold', 'PublicSans-Bold'),
  /** A handwritten note in the margin. Remarks only. */
  hand: face('Kalam_400Regular', 'Kalam-Regular'),
} as const;
