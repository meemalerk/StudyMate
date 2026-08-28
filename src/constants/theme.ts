/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#16181B',
    background: '#F6F5F2',
    card: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#65686E',
    border: '#E4E3DE',
    tint: '#0F6D5C',
    tintSoft: '#E4EFEB',
    success: '#0F6D5C',
    danger: '#B3261E',
  },
  dark: {
    text: '#F2F1ED',
    background: '#000000',
    card: '#1B1C1E',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#A6A9AE',
    border: '#2B2C2E',
    tint: '#4FBF9F',
    tintSoft: '#17251F',
    success: '#4FBF9F',
    danger: '#E5786E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Widened shape of a resolved theme (light or dark) — use this to type theme params, since the
 * literal `as const` types of `Colors.light`/`Colors.dark` aren't assignable to one another. */
export type Theme = Record<ThemeColor, string>;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 14,
  pill: 999,
} as const;

/** Barely-there elevation for cards — the hairline border in `theme.border` carries most of the
 * depth cue, this just softens the edge instead of relying on an obvious drop shadow. */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 1,
  },
  default: {},
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
