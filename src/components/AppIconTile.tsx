import React from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { color } from '@/theme/theme';

/** The mark's light colours, as the brand's light mark has them (gradely-assets/logo/gradely-mark-light.svg). */
const MARK_CREAM = '#F3F1EB';
const MARK_ACCENT = '#8FB2D6';

/**
 * The app icon tile — the Gradely mark in cream on navy — drawn as vectors.
 *
 * Navy since 2026-10-04 (Ed: "change the paper logo to navy logo",
 * everywhere); before, it was ledger paper with a red margin. Drawn here
 * rather than shown from a bitmap, so it is sharp at any size and density.
 *
 * Same drawing as the native launch image (`scripts/make-splash.mjs`) and the
 * launcher icons (`scripts/make-icons.py`): the 64-unit mark scaled by 14.594
 * and moved to 44.5, 27.7 on a 1024 tile, rounded the way iOS rounds an icon.
 */
export function AppIconTile({ size = 76 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
      <Rect x={0} y={0} width={1024} height={1024} rx={228} fill={color.primary} />
      <G transform="translate(44.5 27.7) scale(14.594)">
        <Path d="M11 47Q22 43.5 32 19" stroke={MARK_CREAM} strokeWidth={8.5} strokeLinecap="round" />
        <Path d="M53 47Q42 43.5 32 19" stroke={MARK_CREAM} strokeWidth={8.5} strokeLinecap="round" />
        <Path d="M21 39H43" stroke={MARK_ACCENT} strokeWidth={7} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
