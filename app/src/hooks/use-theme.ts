/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, CouleursJauge } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const leTheme = (scheme: ReturnType<typeof useColorScheme>) => (scheme === 'dark' ? 'dark' : 'light');

export function useTheme() {
  return Colors[leTheme(useColorScheme())];
}

/** Les couleurs des jauges (selon leur état) dans le thème du téléphone. */
export function useCouleursJauge() {
  return CouleursJauge[leTheme(useColorScheme())];
}
