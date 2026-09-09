/**
 * User API - User profile and settings endpoints
 */

import apiClient, { handleApiError } from "./client";
import { User, UserUpdateData, SpendingSummary } from "../types/user";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  try {
    const response = await apiClient.get<ApiResponse<User>>("/user/profile");

    if (!response.data?.data) {
      throw new Error(response.data?.message || "Invalid server response");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UserUpdateData): Promise<User> => {
  try {
    const response = await apiClient.put<ApiResponse<User>>(
      "/user/profile",
      data
    );

    if (!response.data?.data) {
      throw new Error(response.data?.message || "Invalid server response");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get spending summary
 */
export const getSpendingSummary = async (date?: string): Promise<SpendingSummary> => {
  try {
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<SpendingSummary>>(
      "/user/spending-summary",
      {
        params,
      }
    );

    if (!response.data?.data) {
      throw new Error(response.data?.message || "Invalid server response");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<void> => {
  try {
    await apiClient.delete("/user/account");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export default {
  getProfile,
  updateProfile,
  getSpendingSummary,
  deleteAccount,
};
