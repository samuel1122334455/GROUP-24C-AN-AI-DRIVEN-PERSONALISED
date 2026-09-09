/**
 * User Store - Zustand
 *
 * Manages user profile, financial goals, and spending summary
 */

import { create } from "zustand";
import { User, UserProfile, SpendingSummary } from "../types/user";

interface UserState {
  // State
  user: User | null;
  spendingSummary: SpendingSummary | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setSpendingSummary: (summary: SpendingSummary) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState>((set: any) => ({
  // Initial state
  user: null,
  spendingSummary: null,
  isLoading: false,

  /**
   * Set user data
   */
  setUser: (user: User) => {
    set({ user, isLoading: false });
  },

  /**
   * Update user profile (partial update)
   */
  updateProfile: (profile: Partial<UserProfile>) => {
    set((state: any) => {
      if (!state.user) return state;

      return {
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            ...profile,
          },
        },
      };
    });
  },

  /**
   * Set spending summary
   */
  setSpendingSummary: (summary: SpendingSummary) => {
    set({ spendingSummary: summary });
  },

  /**
   * Clear user data (logout)
   */
  clearUser: () => {
    set({
      user: null,
      spendingSummary: null,
      isLoading: false,
    });
  },

  /**
   * Set loading state
   */
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));

export default useUserStore;
