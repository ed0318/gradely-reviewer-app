import { StyleSheet } from 'react-native';
import { color, font, radius } from '@/theme/theme';

/** gradely-app's setup look, shared by the three steps. */
export const onboardingStyles = StyleSheet.create({
  step: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted },
  title: { fontFamily: font.title, fontSize: 30, letterSpacing: -0.6, color: color.ink, marginTop: 10 },
  subtitle: { fontFamily: font.uiRegular, fontSize: 13.5, lineHeight: 20, color: color.inkMuted, marginTop: 10, marginBottom: 22 },
  label: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginBottom: 8 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
    fontFamily: font.uiRegular,
    fontSize: 15,
    color: color.ink,
  },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.card },
  spacedTop: { marginTop: 20 },
  noteTop: { marginTop: 22 },
});
