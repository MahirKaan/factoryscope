// theme/useThemeColor.ts

import { ThemeColors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
): string {
  const { theme, colors } = useTheme();

  // Temadan alınan yedek renk
  const fallbackColor = colors?.[colorName] ?? '#ff00ff';

  // Öncelik props’tan gelen değerlerde
  return props[theme] ?? fallbackColor;
}
