/**
 * Theme Store - Zustand
 *
 * Manages theme state (light/dark mode)
 */

import { create } from "zustand";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  // State
  themeMode: ThemeMode;
  isDark: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_KEY = "theme_mode";

/**
 * Get current theme based on mode
 */
const getIsDark = (mode: ThemeMode): boolean => {
  if (mode === "system") {
    return Appearance.getColorScheme() === "dark";
  }
  return mode === "dark";
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Initial state
  themeMode: "system",
  isDark: getIsDark("system"),

  /**
   * Set theme mode and persist
   */
  setThemeMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      set({
        themeMode: mode,
        isDark: getIsDark(mode),
      });
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  },

  /**
   * Load theme from storage
   */
  loadTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_KEY);
      const mode = (savedMode as ThemeMode) || "system";
      set({
        themeMode: mode,
        isDark: getIsDark(mode),
      });
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  },

  /**
   * Toggle between light and dark
   */
  toggleTheme: async () => {
    const currentMode = get().themeMode;
    const newMode = currentMode === "dark" ? "light" : "dark";
    await get().setThemeMode(newMode);
  },
}));

/**
 * Listen to system theme changes
 */
Appearance.addChangeListener(({ colorScheme }) => {
  const { themeMode, setThemeMode } = useThemeStore.getState();
  if (themeMode === "system") {
    useThemeStore.setState({ isDark: colorScheme === "dark" });
  }
});
