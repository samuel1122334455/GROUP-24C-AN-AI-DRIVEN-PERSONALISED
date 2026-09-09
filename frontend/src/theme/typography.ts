/**
 * Typography System - Based on Roboto Mono font family
 *
 * Font sizes and weights extracted from UI designs
 */

export const typography = {
  // Font families
  fontFamily: {
    display: "RobotoMono-Bold", // Default for display
    body: "RobotoMono-Regular", // Default for body
    system:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Font sizes (matching Tailwind scale from designs)
  fontSize: {
    xs: 10, // text-[10px]
    sm: 12, // text-xs
    base: 14, // text-sm
    md: 15, // text-[15px]
    lg: 16, // text-base
    xl: 18, // text-lg
    "2xl": 20, // text-xl
    "3xl": 24, // text-2xl
    "4xl": 28, // text-3xl
    "5xl": 32, // text-4xl
  },

  // Font weights
  fontWeight: {
    regular: "400" as "400",
    medium: "500" as "500",
    semibold: "600" as "600",
    bold: "700" as "700",
    extrabold: "800" as "800",
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },
};

/**
 * Predefined text styles for common use cases
 */
export const textStyles = {
  // Headings
  h1: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize["4xl"],
    lineHeight: typography.lineHeight.tight,
  },

  h2: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize["3xl"],
    lineHeight: typography.lineHeight.tight,
  },

  h3: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize["2xl"],
    lineHeight: typography.lineHeight.tight,
  },

  h4: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.tight,
  },

  // Body text
  body: {
    fontFamily: "RobotoMono-Regular",
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.relaxed,
  },

  bodySmall: {
    fontFamily: "RobotoMono-Regular",
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
  },

  // Labels
  label: {
    fontFamily: "RobotoMono-Medium",
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
  },

  labelSmall: {
    fontFamily: "RobotoMono-Medium",
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal,
  },

  // Buttons
  button: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.normal,
  },

  buttonSmall: {
    fontFamily: "RobotoMono-Bold",
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
  },

  // Caption
  caption: {
    fontFamily: "RobotoMono-Medium",
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.normal,
  },
};

export default typography;
