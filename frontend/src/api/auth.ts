/**
 * Auth API - Authentication endpoints
 */

import apiClient, { handleApiError } from "./client";
import { UserLoginData, UserRegistrationData, User } from "../types/user";
import { useAuthStore } from "../stores/authStore";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register new user
 */
export const register = async (
  data: UserRegistrationData
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
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
 * Login user
 */
export const login = async (data: UserLoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
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
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<RefreshTokenResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      "/auth/refresh",
      {
        refreshToken,
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
 * Logout (invalidate refresh token on server)
 */
export const logout = async (): Promise<void> => {
  try {
    const { refreshToken } = useAuthStore.getState();
    await apiClient.post("/auth/logout", { refreshToken });
  } catch (error) {
    // Best-effort: logout can fail if access token is expired; always clear local tokens.
    // Keep noise low in production/dev.
    return;
  }
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
};
