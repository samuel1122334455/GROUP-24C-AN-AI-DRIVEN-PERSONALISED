/**
 * Color Palette - Extracted from UI designs
 *
 * All colors match the exact values from the provided HTML/Tailwind designs.
 * Dark mode is the default theme.
 */

export const colors = {
  // Primary brand colors (Blue)
  primary: "#2D9CDB",
  primaryDark: "#1A5F8A",
  primaryHover: "#3AA8E0",
  primaryLight: "#56CCF2",

  // Accent colors (Gold)
  accent: "#F2C94C",
  accentOrange: "#F2994A",
  accentYellow: "#F2C94C",

  // Background colors
  backgroundLight: "#f6f8f6",
  backgroundDark: "#121212",
  backgroundDarkAlt: "#141e15",

  // Surface colors
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1E1E1E",
  surfaceDarkLight: "#2C2C2C",
  surfaceDarkAlt: "#1f2b21",
  surfaceDarkVariant: "#1e2b20",

  // Text colors
  textPrimaryLight: "#1f2937",
  textPrimaryDark: "#ffffff",
  textSecondaryLight: "#6b7280",
  textSecondaryDark: "#a3b2a4",

  // UI state colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Semantic colors
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    900: "#14532d",
  },

  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    900: "#7c2d12",
  },

  blue: {
    100: "#dbeafe",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    900: "#1e3a8a",
  },

  yellow: {
    500: "#eab308",
  },

  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  red: {
    50: "#fef2f2",
    400: "#f87171",
    500: "#ef4444",
    900: "#7f1d1d",
  },

  indigo: {
    600: "#4f46e5",
  },

  purple: {
    400: "#c084fc",
  },
};

/**
 * Theme-aware color accessor
 * Automatically switches between light and dark mode colors
 */
export const getThemedColors = (isDark: boolean = true) => ({
  background: isDark ? colors.backgroundDark : colors.backgroundLight,
  surface: isDark ? colors.surfaceDark : colors.surfaceLight,
  text: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
  textSecondary: isDark ? colors.textSecondaryDark : colors.textSecondaryLight,
  primary: colors.primary,
  accent: colors.accent,
  border: isDark ? "rgba(255, 255, 255, 0.05)" : colors.gray[200],
});

export default colors;
