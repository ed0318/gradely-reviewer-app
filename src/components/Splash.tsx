import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { Paper } from '@/components/Paper';
import { color, font } from '@/theme/theme';

type SplashProps = {
  /** What the app is waiting on, shown under the bar. */
  statusLabel?: string;
};

/**
 * What the student sees while the app opens, drawn in place of the navigator
 * so no frame shows the wrong screen. Matches gradely-app's Splash, with
 * "Reviewer" under the wordmark.
 */
export function Splash({ statusLabel = 'Getting your reviewers ready' }: SplashProps) {
  // The bar drifts along its track and back, so a slow open still shows motion.
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(drift);
  }, [drift]);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * (TRACK_WIDTH * 0.48) }] }));

  return (
    <View style={styles.root} accessibilityLabel="Gradely Reviewer is opening">
      <Paper margin={18} />
      {/* Same tile and size as the native launch image, so the hand-over does not jump. */}
      <AppIconTile size={76} />
      <Text style={styles.wordmark}>Gradely</Text>
      {/* A highlighter stroke under "Reviewer", as in the mockup. */}
      <View style={styles.productWrap}>
        <View style={styles.highlight} />
        <Text style={styles.productName}>Reviewer</Text>
      </View>
      <Text style={styles.tagline}>Make your own reviewer. Take it again and again.</Text>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, fillStyle]} />
        </View>
        <Text style={styles.progressLabel} numberOfLines={1}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const TRACK_WIDTH = 120;
/** The mockup's highlighter yellow behind "Reviewer". */
const HIGHLIGHTER = '#FFDD55';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  wordmark: {
    fontFamily: font.brand,
    fontSize: 40,
    letterSpacing: -0.8,
    color: color.primary,
    marginTop: 26,
  },
  productWrap: { marginTop: 6, paddingHorizontal: 6 },
  highlight: { position: 'absolute', left: 0, right: 0, top: '52%', bottom: '8%', backgroundColor: HIGHLIGHTER },
  productName: {
    fontFamily: font.brand,
    fontSize: 28,
    letterSpacing: -0.6,
    color: color.primary,
  },
  tagline: { fontFamily: font.uiRegular, fontSize: 13.5, color: color.inkMuted, marginTop: 12, textAlign: 'center' },
  progressWrap: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: 14,
  },
  progressTrack: {
    width: TRACK_WIDTH,
    height: 3,
    borderRadius: 999,
    backgroundColor: color.line,
    overflow: 'hidden',
  },
  progressFill: {
    width: '52%',
    height: 3,
    borderRadius: 999,
    backgroundColor: color.primary,
  },
  progressLabel: {
    fontFamily: font.uiRegular,
    fontSize: 12,
    color: color.inkMuted,
  },
});
