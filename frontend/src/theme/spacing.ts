/**
 * Spacing System - Consistent spacing scale
 *
 * Based on 4px base unit (matching Tailwind's spacing)
 */

export const spacing = {
  // Base spacing scale
  xs: 4, // 0.25rem
  sm: 8, // 0.5rem
  md: 12, // 0.75rem
  lg: 16, // 1rem
  xl: 24, // 1.5rem
  "2xl": 32, // 2rem
  "3xl": 48, // 3rem
  "4xl": 64, // 4rem

  // Specific spacing values (matching designs)
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,

  // Screen padding
  screenPadding: 16,
  cardPadding: 16,

  // Component spacing
  componentGap: 12,
  sectionGap: 24,
};

/**
 * Helper function to get spacing value
 */
export const getSpacing = (multiplier: number): number => {
  return spacing.lg * multiplier;
};

export default spacing;
