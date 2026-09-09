/**
 * Authentication Store - Zustand
 *
 * Manages authentication state, tokens, and auth operations
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  loadTokens: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

/**
 * Secure token storage keys
 */
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,

  /**
   * Store tokens securely and update state
   */
  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to store tokens:", error);
      throw error;
    }
  },

  /**
   * Clear tokens from secure storage and state
   */
  clearTokens: async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to clear tokens:", error);
      throw error;
    }
  },

  /**
   * Load tokens from secure storage on app start
   */
  loadTokens: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to load tokens:", error);
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Set loading state
   */
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));

export default useAuthStore;
