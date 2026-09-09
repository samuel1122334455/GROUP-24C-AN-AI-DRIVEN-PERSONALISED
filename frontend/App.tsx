/**
 * App.tsx - Main Application Entry Point
 *
 * Initializes the app, loads fonts, and sets up navigation
 */

import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  RobotoMono_400Regular,
  RobotoMono_500Medium,
  RobotoMono_600SemiBold,
  RobotoMono_700Bold,
} from "@expo-google-fonts/roboto-mono";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppAlertModal } from "./src/components/common/AppAlertModal";
import { useAuthStore } from "./src/stores/authStore";
import { useThemeStore } from "./src/stores/themeStore";
import { useUserStore } from "./src/stores/userStore";
import * as userApi from "./src/api/user";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import apiClient from "./src/api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const { loadTokens, isAuthenticated } = useAuthStore();
  const { loadTheme, isDark } = useThemeStore();
  const { setUser, setSpendingSummary } = useUserStore();
  const hasHydrated = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    "RobotoMono-Regular": RobotoMono_400Regular,
    "RobotoMono-Medium": RobotoMono_500Medium,
    "RobotoMono-SemiBold": RobotoMono_600SemiBold,
    "RobotoMono-Bold": RobotoMono_700Bold,
  });

  useEffect(() => {
    // Load stored auth tokens and theme on app start
    loadTokens();
    loadTheme();
  }, []);

  useEffect(() => {
    // Reset the gate when the user logs out so the next login hydrates fresh.
    if (!isAuthenticated) {
      hasHydrated.current = false;
      return;
    }

    // Run exactly once per login session — never re-trigger on user/summary changes.
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    let cancelled = false;
    const hydrate = async () => {
      try {
        const profile = await userApi.getProfile();
        if (!cancelled) setUser(profile);
        const summary = await userApi.getSpendingSummary();
        if (!cancelled) setSpendingSummary(summary);
      } catch {
        // Best-effort; screens render with defaults if this fails.
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [isAuthenticated]); // ← only isAuthenticated; never re-fires on data changes

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const registerPushToken = async () => {
      // expo-notifications remote push is not supported in Expo Go from SDK 53+
      // Skip silently — works in development builds and production
      if (Constants.executionEnvironment === "storeClient") return;

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        await apiClient.post("/user/push-token", { pushToken: tokenData.data });
      } catch (err) {
        console.warn("Push token registration failed:", err);
      }
    };

    registerPushToken();
  }, [isAuthenticated]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen === "WeeklyReport" && data?.reportId) {
        // Navigation handled by OS when app is backgrounded; foreground case noted for future nav ref
        console.log("[Notification] WeeklyReport deep-link received:", data.reportId);
      }
    });
    return () => sub.remove();
  }, []);

  // Render app immediately (falls back to system font if custom font is loading)

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppNavigator />
      <AppAlertModal />
    </SafeAreaProvider>
  );
}
