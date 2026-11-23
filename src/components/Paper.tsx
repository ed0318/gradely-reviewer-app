import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { color } from '@/theme/theme';

/** The distance between two ruled lines, in points. */
export const RULE_PITCH = 28;

/**
 * The page every screen is written on: faint ruling and a red margin line.
 *
 * Drawn behind the content, absolutely, so it never takes part in layout and a
 * card laid over it simply covers the lines the way a pasted-in slip would. One
 * SVG pattern rather than a view per line: a tall page would otherwise be a
 * hundred views that do nothing.
 *
 * `margin` is the x of the red line, measured from the left of the window. On a
 * tablet the column is centred, so the caller passes where the column starts.
 */
export function Paper({ margin = 10 }: { margin?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="ruling" x="0" y="0" width="8" height={RULE_PITCH} patternUnits="userSpaceOnUse">
            <Line x1="0" y1={RULE_PITCH - 0.5} x2="8" y2={RULE_PITCH - 0.5} stroke={color.ruling} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ruling)" />
      </Svg>
      <View style={[styles.margin, { left: margin }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  margin: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: color.margin, opacity: 0.45 },
});
