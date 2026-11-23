import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IOS, IOS_DIM, RIPPLE } from '@/theme/press';
import { color, font, radius } from '@/theme/theme';
import { Icon, type IconName } from './Icon';
import { useLayout } from '@/layout/useLayout';

export type SegmentOption = {
  key: string;
  label: string;
  badge?: string | number;
  /** An icon beside the label instead of a text badge, e.g. a warning. */
  badgeIcon?: IconName;
  badgeColor?: string;
  /** `circle` puts a number in a filled circle of `badgeColor`, like a notification count. */
  badgeShape?: 'text' | 'circle';
  /** What the badge means, read out after the label by a screen reader. */
  badgeHint?: string;
};

export function Segmented({
  options,
  value,
  onChange,
  disabled,
  roomy,
  role = 'radio',
}: {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
  /** Reads as a label of what is chosen; no segment can be picked. */
  disabled?: boolean;
  /** On a tablet, taller segments with more padding and larger labels. */
  roomy?: boolean;
  /**
   * What a screen reader calls it. `radio` (the default) picks a value — a
   * backup schedule, a question type. `tab` switches what the screen below it
   * shows, as the class's Students / Work / Attendance does.
   */
  role?: 'radio' | 'tab';
}) {
  const { tablet } = useLayout();
  const big = tablet && roomy ? roomyStyles : null;
  return (
    <View
      style={[styles.track, big?.track, disabled && styles.trackDisabled]}
      accessibilityRole={role === 'tab' ? 'tablist' : 'radiogroup'}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            disabled={disabled}
            // Drawn 32 tall on a phone; the touch reaches 44, the iOS minimum.
            // Vertical only, so neighbouring segments never share a touch.
            hitSlop={big ? undefined : { top: 6, bottom: 6 }}
            accessibilityRole={role}
            accessibilityLabel={opt.badgeHint ? `${opt.label}, ${opt.badgeHint}` : undefined}
            accessibilityState={{ disabled: !!disabled, selected: active }}
            // The same ripple and border width selected or not: on Android a
            // segment that lost its border and gained a ripple as the
            // selection moved away drew its label blank.
            android_ripple={RIPPLE}
            style={({ pressed }) => [styles.seg, big?.seg, active && styles.segActive, IOS && pressed && !active && IOS_DIM]}
          >
            {/* One line at any text size. At large text "Attendance" broke as
                "Attendan / ce"; the label shrinks just enough to fit instead.
                Stacking the segments would push what they switch off the screen.

                iOS only: Android's adjustsFontSizeToFit re-measures a label
                whose style changes and can shrink it to nothing, so tapping a
                segment left the others blank. On Android the label's growth
                with the system text size is capped instead, and a label too
                long for its segment ends in "…". */}
            <Text
              // Remade when the selection moves, so Android measures it afresh
              // rather than keeping a width from the other state.
              key={active ? 'on' : 'off'}
              style={[styles.label, big?.label, active && styles.labelActive, { flexShrink: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit={IOS}
              minimumFontScale={0.6}
              maxFontSizeMultiplier={IOS ? undefined : 1.3}
            >
              {opt.label}
            </Text>
            {opt.badgeIcon ? (
              <Icon name={opt.badgeIcon} size={big ? 20 : 15} color={opt.badgeColor ?? color.clay} />
            ) : (
              opt.badge != null &&
              (opt.badgeShape === 'circle' ? (
                <View style={[styles.circle, big?.circle, { backgroundColor: opt.badgeColor ?? color.clay }]}>
                  <Text style={[styles.circleText, big?.circleText]} maxFontSizeMultiplier={1.4}>
                    {opt.badge}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.badge, big?.badge, { color: opt.badgeColor ?? color.clay }]} maxFontSizeMultiplier={1.4}>
                  {opt.badge}
                </Text>
              ))
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, flexDirection: 'row', backgroundColor: color.field, borderRadius: radius.field, padding: 3 },
  trackDisabled: { opacity: 0.55 },
  seg: { flex: 1, minHeight: 32, paddingVertical: 4, borderRadius: radius.field, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  segActive: { backgroundColor: color.surface, borderColor: color.line },
  label: { fontFamily: font.ui, fontSize: 12.5, color: color.inkMuted },
  labelActive: { color: color.ink },
  badge: { fontFamily: font.mono, fontSize: 11 },
  circle: { minWidth: 18, minHeight: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontFamily: font.monoStrong, fontSize: 11, lineHeight: 14, color: color.onPrimary },
});

/** Sit on top of `styles` and go through the tablet scale like every stylesheet. */
const roomyStyles = StyleSheet.create({
  track: { padding: 5 },
  seg: { minHeight: 46, gap: 8, paddingHorizontal: 12 },
  label: { fontSize: 14.5 },
  badge: { fontSize: 13 },
  circle: { minWidth: 22, minHeight: 22, borderRadius: 11, paddingHorizontal: 6 },
  circleText: { fontSize: 12.5, lineHeight: 16 },
});
