import { StyleSheet } from 'react-native';
import { color, font, radius } from '@/theme/theme';

/** Shared by the three hand-over steps. */
export const handoverStepStyles = StyleSheet.create({
  title: { fontFamily: font.title, fontSize: 28, lineHeight: 30, color: color.ink },
  body: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted },
  strong: { fontFamily: font.rowTitle, color: color.ink },
  card: { gap: 4, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fill: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted },
  cardText: { fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 18, color: color.inkMuted },
  rowTitle: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  fileIcon: { width: 40, height: 40, borderRadius: radius.card, backgroundColor: '#EEF5EF', alignItems: 'center', justifyContent: 'center' },
  saveButton: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.field, borderWidth: 1, borderColor: color.primary, justifyContent: 'center' },
  saveText: { fontFamily: font.rowTitle, fontSize: 13, color: color.primary },
  resend: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
  resendText: { fontFamily: font.rowTitle, fontSize: 14, color: color.primary },
});
