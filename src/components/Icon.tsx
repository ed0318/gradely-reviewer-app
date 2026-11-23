import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import { scaled } from '@/layout/tabletScale';
import { color as palette } from '@/theme/theme';

const map = {
  // Gradely Reviewer's own: the tabs, credits and the hand-over backup.
  home: 'home-outline',
  topics: 'book-open-page-variant-outline',
  progress: 'chart-bar',
  credits: 'circle-multiple-outline',
  fileCheck: 'file-check-outline',
  warning: 'alert-outline',
  today: 'clock-outline',
  classes: 'book-open-page-variant-outline', // replaced by the Lucide path below
  students: 'account-group-outline',
  // A calendar with writing on it, not a notebook: the tab now opens on a month
  // of plans, and a notebook was the same idea as the Classes book beside it.
  lessons: 'calendar-text-outline',
  settings: 'cog-outline',
  add: 'plus',
  arrowForward: 'arrow-right',
  search: 'magnify',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  more: 'dots-horizontal',
  moreVertical: 'dots-vertical',
  expandMore: 'chevron-down',
  personAdd: 'account-plus-outline',
  close: 'close',
  backspace: 'backspace-outline',
  avatar: 'account-circle-outline',
  schoolYear: 'calendar-range-outline',
  // Drawn from Lucide below — Material has no `library-big`. The value here is
  // only the fallback the renderer never reaches while that drawing exists,
  // since `map` has to hold every name.
  subjects: 'library',
  // The same layers as `scale`: grading schemes and grading scales are two
  // halves of one idea, and the settings rows for them sit together.
  grading: 'layers-outline',
  // The mortarboard. It reads as "how far through school", which is what this
  // row sets.
  level: 'school-outline',
  /** The school's DepEd details: the building, not the mortarboard. */
  school: 'office-building-outline',
  scale: 'layers-outline',
  subscription: 'crown-outline',
  backup: 'cloud-upload-outline',
  data: 'database-outline',
  faq: 'help-circle-outline',
  /** The how-to guide: a route through the app, not a question. */
  guide: 'map-marker-path',
  /** The setup tour, in Settings. */
  tour: 'compass-outline',
  /** A tutorial video. */
  play: 'play-circle-outline',
  /** The student grade view: a QR a student's card carries. */
  qr: 'qrcode',
  laptop: 'laptop',
  wifi: 'wifi',
  fullscreen: 'fullscreen',
  logout: 'logout',
  info: 'information-outline',
  error: 'alert-circle-outline',
  refresh: 'refresh',
  check: 'check',
  event: 'calendar-blank-outline',
  clock: 'clock-outline',
  mail: 'email-outline',
  lock: 'lock-outline',
  chat: 'chat-outline',
  print: 'printer-outline',
  copy: 'content-copy',
  uploadFile: 'file-upload-outline',
  share: 'share-variant-outline',
  download: 'download-outline',
  delete: 'delete-outline',
  assignment: 'clipboard-text-outline',
  camera: 'camera-outline',
  edit: 'pencil-outline',
  // The subject's class page: its gradebook, work and attendance.
  view: 'clipboard-text-outline',
  chevronUp: 'chevron-up',
  checkOn: 'checkbox-marked',
  checkOff: 'checkbox-blank-outline',
  radioOn: 'radiobox-marked',
  radioOff: 'radiobox-blank',
  exam: 'file-document-edit-outline',
  /** The two ways the lesson plans tab can be read: a month, or a list. */
  calendarView: 'calendar-month-outline',
  listView: 'format-list-bulleted',
  /** Reminders, and the way to everything that has rung. */
  bell: 'bell-outline',
  /** The evening summary: the day is done. */
  night: 'weather-night',
  /** The Notifications list. */
  inbox: 'inbox-outline',
  /** The recitation caller: call a name at random. */
  shuffle: 'shuffle-variant',
  /** The recitation caller: choose who answers. */
  hand: 'hand-back-right-outline',
  /** Settings › Resources, and the file types it lists. */
  resources: 'folder-download-outline',
  // AI assistant: the sparkle most apps use for "made with AI".
  ai: 'creation-outline',
  key: 'key-variant',
  flag: 'flag-outline',
  filePdf: 'file-pdf-box',
  fileWord: 'file-word-outline',
  fileExcel: 'file-excel-outline',
  filePowerpoint: 'file-powerpoint-outline',
  fileOther: 'file-outline',
} as const;

export type IconName = keyof typeof map;

/**
 * Icons the Material set has no faithful match for, drawn from Lucide's own
 * 24x24 geometry so they sit right next to the rest.
 */
const lucide: Partial<Record<IconName, string[]>> = {
  // Reviewer's Topics tab: the same open book as Gradely's Classes.
  topics: [
    'M12 7v14',
    'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  ],
  classes: [
    'M12 7v14',
    'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  ],
  // Lucide's `library-big`. Material has no equivalent, and the three it does
  // have — `library`, `library-shelves`, `bookshelf` — are solid shapes that
  // read as a dark blob at 19px beside the outline glyphs around them.
  //
  // Lucide draws the tall book as `<rect x=3 y=3 width=8 height=18 rx=1 />`,
  // which is written out as a path here because this renderer emits paths and
  // nothing else. The geometry is the same rounded rectangle.
  subjects: [
    'M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    'M7 3v18',
    'M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z',
  ],
};

export function Icon({ name, size = 19, color = palette.ink }: { name: IconName; size?: number; color?: string }) {
  const paths = lucide[name];
  if (paths) {
    return (
      <Svg width={scaled(size)} height={scaled(size)} viewBox="0 0 24 24" fill="none">
        {paths.map((d) => (
          <Path key={d} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    );
  }
  return <MaterialCommunityIcons name={map[name] as any} size={scaled(size)} color={color} />;
}
