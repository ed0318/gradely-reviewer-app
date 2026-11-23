import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { scaledControl } from '@/layout/tabletScale';

export function GradelyMark({ size = 48, stroke = '#123A63', accent = '#8FB2D6' }: { size?: number; stroke?: string; accent?: string }) {
  return (
    <Svg width={scaledControl(size)} height={scaledControl(size)} viewBox="0 0 64 64" fill="none">
      <Path d="M11 47Q22 43.5 32 19" stroke={stroke} strokeWidth={8.5} strokeLinecap="round" />
      <Path d="M53 47Q42 43.5 32 19" stroke={stroke} strokeWidth={8.5} strokeLinecap="round" />
      <Path d="M21 39H43" stroke={accent} strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}
