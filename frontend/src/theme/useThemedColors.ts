/**
 * useThemedColors Hook
 *
 * Returns theme-aware colors based on current theme mode
 */

import { useThemeStore } from "../stores/themeStore";
import { colors } from "./colors";

export const useThemedColors = () => {
  const { isDark } = useThemeStore();

  return {
    // Background colors
    background: isDark ? colors.backgroundDark : colors.backgroundLight,
    backgroundAlt: isDark ? colors.backgroundDarkAlt : colors.gray[50],

    // Surface colors
    surface: isDark ? colors.surfaceDark : colors.surfaceLight,
    surfaceAlt: isDark ? colors.surfaceDarkLight : colors.gray[100],

    // Backwards-compatible alias used across screens
    surfaceLight: isDark ? colors.surfaceDarkLight : colors.gray[100],

    // Text colors
    textPrimary: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
    textSecondary: isDark
      ? colors.textSecondaryDark
      : colors.textSecondaryLight,

    // Border colors
    border: isDark ? "rgba(255, 255, 255, 0.05)" : colors.gray[200],
    borderLight: isDark ? "rgba(255, 255, 255, 0.1)" : colors.gray[300],

    // Static colors (don't change with theme)
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,

    // Original colors object for backwards compatibility
    colors,

    // Theme state
    isDark,
  };
};
