/**
 * Border Radius System
 *
 * Extracted from Tailwind config in UI designs
 */

export const radius = {
  none: 0,
  sm: 4, // DEFAULT: 0.25rem
  md: 8, // lg: 0.5rem
  lg: 12, // xl: 0.75rem
  xl: 16, // 2xl: 1rem
  "2xl": 24, // 3xl: 1.5rem
  "3xl": 32, // Custom large radius
  full: 9999, // Perfect circles
};

/**
 * Common border radius presets for components
 */
export const radiusPresets = {
  button: radius.full,
  card: radius.xl,
  cardLarge: radius["2xl"],
  input: radius.full,
  chip: radius.full,
  avatar: radius.full,
  modal: radius.xl,
  sheet: radius.xl,
};

export default radius;
