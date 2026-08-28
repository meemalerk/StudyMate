/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { themePreference } = useThemePreference();

  const resolvedScheme =
    themePreference === 'system' ? (systemScheme ?? 'light') : themePreference;

  return Colors[resolvedScheme];
}
