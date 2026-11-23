import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color as palette } from '@/theme/theme';

/**
 * Stroke icons from the mockup (24-unit grid, 2-unit stroke). Decorative by
 * default: the button or row that holds one carries the accessibility label.
 */
export type IconName =
  | 'home'
  | 'topics'
  | 'progress'
  | 'credits'
  | 'settings'
  | 'back'
  | 'chevronRight'
  | 'camera'
  | 'lock'
  | 'info'
  | 'clock'
  | 'refresh'
  | 'fileCheck'
  | 'warning'
  | 'calendar'
  | 'plus'
  | 'exam'
  | 'trash';

type IconProps = { name: IconName; size?: number; color?: string };

export function Icon({ name, size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {renderIconShape(name)}
    </Svg>
  );
}

function renderIconShape(name: IconName) {
  switch (name) {
    case 'home':
      return <Path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />;
    case 'topics':
      return <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7" />;
    case 'progress':
      return <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />;
    case 'credits':
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15" />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx={12} cy={12} r={3} />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </>
      );
    case 'back':
      return <Path d="M15 6l-6 6 6 6" />;
    case 'chevronRight':
      return <Path d="M9 6l6 6-6 6" />;
    case 'camera':
      return (
        <>
          <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <Circle cx={12} cy={13} r={3.5} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 8h.01M11 12h1v5h1" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v5l3 2" />
        </>
      );
    case 'refresh':
      return <Path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />;
    case 'fileCheck':
      return <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 14l2 2 4-4" />;
    case 'warning':
      return <Path d="M12 3l9 16H3zM12 10v4M12 17h.01" />;
    case 'calendar':
      return (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={2} />
          <Path d="M3 10h18M8 3v4M16 3v4" />
        </>
      );
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'exam':
      return <Path d="M8 4h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h3" />;
    case 'trash':
      return <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />;
  }
}
