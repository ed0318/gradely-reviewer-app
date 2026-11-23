import { Platform, type PressableAndroidRippleConfig } from 'react-native';
import { color } from './theme';

/**
 * How a press answers, on each platform: Android with Material's ripple, iOS
 * by dimming or tinting what is under the finger. Both show in the frame the
 * finger lands, so a tap that registered looks like one before anything it
 * opens has had time to draw.
 *
 * A Pressable takes `android_ripple={RIPPLE}` (ignored on iOS) and adds its
 * iOS look only `IOS && pressed`. A rounded control also needs
 * `overflow: 'hidden'`, or the ripple runs past its corners.
 */
export const IOS = Platform.OS === 'ios';

/** On white and on the page. */
export const RIPPLE: PressableAndroidRippleConfig = { color: color.ripple };
/** On navy. */
export const RIPPLE_ON_PRIMARY: PressableAndroidRippleConfig = { color: color.rippleOnPrimary };
/** A round ripple about a small target's middle, for one inside a wider cell (a calendar day). */
export const rippleRound = (radius: number): PressableAndroidRippleConfig => ({ color: color.ripple, borderless: true, radius });

/** iOS's look for a pressed control that has no tint of its own. */
export const IOS_DIM = { opacity: 0.6 } as const;

/** Keeps a ripple inside a control's rounded corners. */
export const PRESS_CLIP = { overflow: 'hidden' } as const;
