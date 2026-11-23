import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { color, font } from '@/theme/theme';
import { Icon } from './Icon';

const TIMING = { duration: 240, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/**
 * A header row that folds its children away. Used anywhere a list of things
 * hangs off one parent — a school year's terms, a class's assessments, a
 * subject's marked work.
 *
 * The body is always mounted so it can be measured; the wrapper animates
 * between 0 and that measured height, and the chevron rotates with it.
 */
export function Collapsible({
  title,
  subtitle,
  /** Replaces the title/subtitle column entirely — the chevron floats right so a centred header stays centred. */
  header,
  chevronStyle,
  accessory,
  trailingText,
  trailingTextColor = color.inkMuted,
  leading,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  minHeight = 66,
  animated = true,
  style,
  children,
}: {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  /** Nudges the chevron a custom header floats into its corner. */
  chevronStyle?: ViewStyle;
  /**
   * A control beside the header in place of the chevron — a ⋯ menu button.
   * It sits outside the header's press area, so tapping it does not fold the
   * section and a screen reader reaches it as its own button.
   */
  accessory?: React.ReactNode;
  trailingText?: string;
  trailingTextColor?: string;
  leading?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (next: boolean) => void;
  minHeight?: number;
  /**
   * False opens and closes in one frame. For a fold inside a recycling list:
   * the list places the rows below only once the height has settled, so while
   * the height animates the body draws over the next row (the Classes card).
   */
  animated?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [measured, setMeasured] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;

  const progress = useSharedValue(defaultOpen ? 1 : 0);

  useEffect(() => {
    progress.value = animated ? withTiming(isOpen ? 1 : 0, TIMING) : isOpen ? 1 : 0;
  }, [isOpen, progress, animated]);

  // Until the body has been measured once, an open section renders at its
  // natural height rather than collapsing to zero on the first frame.
  const height = useDerivedValue(() => progress.value * bodyHeight);

  const bodyStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: progress.value,
  }));

  const chevronSpin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  const toggle = () => {
    const next = !isOpen;
    if (controlledOpen == null) setUncontrolledOpen(next);
    onToggle?.(next);
  };

  const headerButton = (
    <Pressable
      onPress={toggle}
      style={[header ? styles.customHeader : styles.header, { minHeight }, accessory ? styles.accessoryHeader : null]}
      accessibilityRole="button"
    >
      {header ?? (
        <>
          {leading}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {trailingText ? <Text style={[styles.trailing, { color: trailingTextColor }]}>{trailingText}</Text> : null}
        </>
      )}
      {!accessory && (
        <Animated.View style={[chevronSpin, header ? styles.floatingChevron : null, header ? chevronStyle : null]}>
          <Icon name="expandMore" size={19} color={color.chevron} />
        </Animated.View>
      )}
    </Pressable>
  );

  return (
    <View style={style}>
      {accessory ? (
        <View style={styles.accessoryRow}>
          {headerButton}
          {accessory}
        </View>
      ) : (
        headerButton
      )}

      <Animated.View style={[styles.body, measured ? bodyStyle : isOpen ? null : styles.hidden]}>
        <View
          style={measured ? styles.measured : undefined}
          // Android flattens views that carry no native-affecting props, which
          // drops this one out of the native tree before it can report a height.
          collapsable={false}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - bodyHeight) > 0.5) setBodyHeight(h);
            if (!measured && h > 0) setMeasured(true);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
  customHeader: { justifyContent: 'center' },
  accessoryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accessoryHeader: { flex: 1, minWidth: 0 },
  floatingChevron: { position: 'absolute', right: 16, top: 16 },
  title: { fontFamily: font.rowTitle, fontSize: 14.5, color: color.ink },
  subtitle: { fontFamily: font.rowSubtitle, fontSize: 12.5, color: color.inkMuted, marginTop: 2 },
  trailing: { fontFamily: font.ui, fontSize: 12.5 },
  body: { overflow: 'hidden' },
  hidden: { height: 0, opacity: 0 },
  measured: { position: 'absolute', left: 0, right: 0, top: 0 },
});
