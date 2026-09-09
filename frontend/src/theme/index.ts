/**
 * Main Theme Export
 *
 * Centralized theme configuration following the design system
 * extracted from the provided UI designs.
 */

import colors, { getThemedColors } from "./colors";
import typography, { textStyles } from "./typography";
import spacing from "./spacing";
import radius, { radiusPresets } from "./radius";
import shadows from "./shadows";

export interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  textStyles: typeof textStyles;
  radiusPresets: typeof radiusPresets;
  isDark: boolean;
}

/**
 * Create theme object with dark mode toggle
 */
export const createTheme = (isDark: boolean = true): Theme => ({
  colors,
  typography,
  spacing,
  radius,
  shadows,
  textStyles,
  radiusPresets,
  isDark,
});

/**
 * Default theme (dark mode)
 */
export const defaultTheme = createTheme(true);

/**
 * Light theme
 */
export const lightTheme = createTheme(false);

// Export individual modules
export {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  textStyles,
  radiusPresets,
  getThemedColors,
};

export { useThemedColors } from "./useThemedColors";

export default defaultTheme;
