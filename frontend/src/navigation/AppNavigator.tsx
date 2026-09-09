/**
 * App Navigator
 *
 * Main navigation structure for the app
 */

import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, useThemedColors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import AuthNavigator from "./AuthNavigator";
import DashboardScreen from "../screens/DashboardScreen";
import ChatHistoryScreen from "../screens/ChatHistoryScreen";
import ChatInterfaceScreen from "../screens/ChatInterfaceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import LogTransactionScreen from "../screens/LogTransactionScreen";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import ScanReceiptScreen from "../screens/ScanReceiptScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import WeeklyReportScreen from "../screens/WeeklyReportScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import NotificationDetailScreen from "../screens/NotificationDetailScreen";

import { RootStackParamList, MainTabParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const themedColors = useThemedColors();
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;
  const tabBarBaseHeight = 68;
  const tabBarHeight = tabBarBaseHeight + androidBottomInset;

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: themedColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themedColors.surface,
          borderTopColor: themedColors.border,
          borderTopWidth: 1,
          paddingBottom: 12 + androidBottomInset,
          paddingTop: 10,
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
          position: "absolute",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: "Home",
        }}
      />
      <MainTab.Screen
        name="ChatHistory"
        component={ChatHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          tabBarLabel: "Coach",
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          tabBarLabel: "Profile",
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          tabBarLabel: "Settings",
        }}
      />
    </MainTab.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { user } = useUserStore();

  if (isLoading) return null;

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 280,
      }}
    >
      {isAuthenticated ? (
        user?.hasCompletedOnboarding === false ? (
          <RootStack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: "fade" }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ animation: "fade" }}
            />
            <RootStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <RootStack.Screen
              name="LogTransaction"
              component={LogTransactionScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom", animationDuration: 320 }}
            />
            <RootStack.Screen name="AllTransactions" component={AllTransactionsScreen} />
            <RootStack.Screen
              name="ScanReceipt"
              component={ScanReceiptScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom", animationDuration: 320 }}
            />
            <RootStack.Screen name="ChatInterface" component={ChatInterfaceScreen} />
            <RootStack.Screen name="WeeklyReport" component={WeeklyReportScreen} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
            <RootStack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
          </>
        )
      ) : (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animation: "fade" }}
        />
      )}
    </RootStack.Navigator>
  );
};

const AppNavigator = () => (
  <NavigationContainer onUnhandledAction={() => {}}>
    <RootNavigator />
  </NavigationContainer>
);

export default AppNavigator;
