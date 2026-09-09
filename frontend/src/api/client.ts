/**
 * API Client - Axios instance with interceptors
 *
 * Handles JWT token injection, refresh, and error handling.
 *
 * Production API:
 * https://thrive.appcidian.com/api
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { useAuthStore } from "../stores/authStore";

// ─────────────────────────────────────────────────────────────────────────────
// API CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = "https://thrive.appcidian.com/api";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH QUEUE
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;

let waitingForRefresh: Array<
  (newToken: string | null) => void
> = [];

const drainQueue = (newToken: string | null) => {
  waitingForRefresh.forEach((callback) => callback(newToken));
  waitingForRefresh = [];
};

// ─────────────────────────────────────────────────────────────────────────────
// AXIOS CLIENT
// ─────────────────────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();

    // Debug: show EXACT URL being requested
    const fullUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[API REQUEST]");
    console.log("Method:", config.method?.toUpperCase());
    console.log("Base URL:", config.baseURL);
    console.log("Path:", config.url);
    console.log("FULL URL:", fullUrl);
    console.log("Has access token:", !!accessToken);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error("[API REQUEST SETUP ERROR]", error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[API RESPONSE]");
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("[API ERROR]");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("URL:", originalRequest?.url);
    console.error("Base URL:", originalRequest?.baseURL);
    console.error("Full URL:",
      `${originalRequest?.baseURL ?? ""}${originalRequest?.url ?? ""}`
    );
    console.error("HTTP Status:", error.response?.status);
    console.error("Response Data:", error.response?.data);
    console.error("Request Object:", error.request);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // No config means there is nothing to retry
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401 responses
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUEUE REQUEST IF TOKEN REFRESH IS ALREADY RUNNING
    // ─────────────────────────────────────────────────────────────────────────

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingForRefresh.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          resolve(apiClient(originalRequest));
        });
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // START TOKEN REFRESH
    // ─────────────────────────────────────────────────────────────────────────

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        isRefreshing = false;
        drainQueue(null);

        return Promise.reject(error);
      }

      const refreshUrl = `${API_BASE_URL}/auth/refresh`;

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("[TOKEN REFRESH]");
      console.log("URL:", refreshUrl);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const response = await axios.post<
        ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>
      >(
        refreshUrl,
        { refreshToken },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const tokenPair = response.data?.data;

      if (!tokenPair?.accessToken || !tokenPair?.refreshToken) {
        throw new Error(
          response.data?.message || "Invalid refresh response"
        );
      }

      await useAuthStore
        .getState()
        .setTokens(
          tokenPair.accessToken,
          tokenPair.refreshToken
        );

      // Allow queued requests to continue
      drainQueue(tokenPair.accessToken);

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization =
          `Bearer ${tokenPair.accessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      drainQueue(null);

      await useAuthStore.getState().clearTokens();

      console.error("[TOKEN REFRESH FAILED]", refreshError);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data: any = error.response.data;

      if (
        Array.isArray(data?.errors) &&
        data.errors.length > 0
      ) {
        const first = data.errors[0];

        const message =
          first?.msg ||
          first?.message;

        if (
          typeof message === "string" &&
          message.trim().length > 0
        ) {
          return message;
        }
      }

      if (
        typeof data?.message === "string" &&
        data.message.trim().length > 0
      ) {
        return data.message;
      }

      return `Request failed with status ${error.response.status}`;
    }

    if (error.request) {
      return "Unable to reach the server. Please check your internet connection.";
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default apiClient;
