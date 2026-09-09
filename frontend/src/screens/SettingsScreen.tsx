/**
 * Settings Screen
 * User preferences, notifications, and account management
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useAlertStore } from "../stores/alertStore";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  useThemedColors,
} from "../theme";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import * as authApi from "../api/auth";
import * as userApi from "../api/user";
import { CurrencyPicker } from "../components/common/CurrencyPicker";
import { getCurrencySymbol } from "../utils/currency";

const SettingsScreen = () => {
  const { clearTokens } = useAuthStore();
  const { user, clearUser, setUser } = useUserStore();
  const { themeMode, isDark, setThemeMode } = useThemeStore();
  const themedColors = useThemedColors();
  const { showAlert } = useAlertStore();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const spendingAlerts = user?.userPrefs?.spendingAlerts ?? true;
  const weeklyReport   = user?.userPrefs?.weeklyReport   ?? true;
  const checkIn        = user?.userPrefs?.checkIn        ?? true;
  const currency       = user?.userPrefs?.currency       ?? "USD";

  const updatePref = async (key: string, value: boolean | string) => {
    try {
      const updated = await userApi.updateProfile({ userPrefs: { [key]: value } } as any);
      setUser(updated);
    } catch {
      showAlert("Error", "Failed to save preference.");
    }
  };

  const handleLogout = async () => {
    showAlert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authApi.logout();
            await clearTokens();
            clearUser();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: themedColors.background,
            borderBottomColor: themedColors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>
          Settings
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: themedColors.surface },
            ]}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=2D9CDB&color=fff" }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text
                  style={[
                    styles.profileName,
                    { color: themedColors.textPrimary },
                  ]}
                >
                  {user?.name || ""}
                </Text>
              </View>
              <Text
                style={[
                  styles.profileEmail,
                  { color: themedColors.textSecondary },
                ]}
              >
                {user?.email || ""}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons
                name="create-outline"
                size={24}
                color={themedColors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: themedColors.textSecondary }]}
          >
            APP PREFERENCES
          </Text>
          <View
            style={[
              styles.settingsGroup,
              { backgroundColor: themedColors.surface },
            ]}
          >
            {/* Currency Preference */}
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowCurrencyPicker(true)}>
                <View style={styles.settingLeft}>
                    <Text style={styles.settingEmoji}>💲</Text>
                    <Text style={[styles.settingTitle, { color: themedColors.textPrimary }]}>Currency</Text>
                </View>
                <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: themedColors.textSecondary }]}>{`${currency} — ${getCurrencySymbol(currency)}`}</Text>
                    <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
                </View>
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: themedColors.border }]}
            />

            {/* Dark Mode */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setThemeMode(isDark ? "light" : "dark")}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🌙</Text>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: themedColors.textPrimary },
                  ]}
                >
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) =>
                  setThemeMode(value ? "dark" : "light")
                }
                trackColor={{
                  false: isDark ? colors.gray[600] : colors.gray[500],
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={
                  isDark ? colors.gray[600] : colors.gray[500]
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: themedColors.textSecondary }]}
          >
            NOTIFICATIONS
          </Text>
          <View
            style={[
              styles.settingsGroup,
              { backgroundColor: themedColors.surface },
            ]}
          >
            {/* Spending Alerts */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🔔</Text>
                <View>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: themedColors.textPrimary },
                    ]}
                  >
                    Spending Alerts
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: themedColors.textSecondary },
                    ]}
                  >
                    Get notified when you overspend
                  </Text>
                </View>
              </View>
              <Switch
                value={spendingAlerts}
                onValueChange={(v) => updatePref("spendingAlerts", v)}
                trackColor={{
                  false: isDark ? colors.gray[600] : colors.gray[500],
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={
                  isDark ? colors.gray[600] : colors.gray[500]
                }
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: themedColors.border }]}
            />

            {/* Budget Check-ins */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>📈</Text>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: themedColors.textPrimary },
                  ]}
                >
                  Budget Check-ins
                </Text>
              </View>
              <Switch
                value={checkIn}
                onValueChange={(v) => updatePref("checkIn", v)}
                trackColor={{
                  false: isDark ? colors.gray[600] : colors.gray[500],
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={
                  isDark ? colors.gray[600] : colors.gray[500]
                }
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: themedColors.border }]}
            />

            {/* Weekly Report */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>📊</Text>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: themedColors.textPrimary },
                  ]}
                >
                  Weekly Report
                </Text>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={(v) => updatePref("weeklyReport", v)}
                trackColor={{
                  false: isDark ? colors.gray[600] : colors.gray[500],
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={
                  isDark ? colors.gray[600] : colors.gray[500]
                }
              />
            </View>
          </View>
        </View>

        {/* Privacy & Account */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: themedColors.textSecondary }]}
          >
            PRIVACY & ACCOUNT
          </Text>
          <View
            style={[
              styles.settingsGroup,
              { backgroundColor: themedColors.surface },
            ]}
          >
            {/* Privacy Policy */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🔒</Text>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: themedColors.textPrimary },
                  ]}
                >
                  Privacy Policy
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themedColors.textSecondary}
              />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: themedColors.border }]}
            />

            {/* Log Out */}
            <TouchableOpacity
              style={[styles.settingRow, styles.logoutRow]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🚪</Text>
                <Text style={styles.logoutText}>Log Out</Text>
              </View>
              {isLoggingOut && <ActivityIndicator size="small" color={colors.error} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.versionText, { color: themedColors.textSecondary }]}>
            Thrive v2.0.0
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency}
        onSelect={(code) => { updatePref("currency", code); }}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.screenPadding,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingLeft: 4,
    fontFamily: typography.fontFamily.display,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    ...shadows.sm,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: typography.fontFamily.body,
  },
  editButton: {
    padding: 8,
  },
  settingsGroup: {
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 60,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingEmoji: {
    fontSize: 24,
    width: 32,
    fontFamily: typography.fontFamily.body,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: typography.fontFamily.body,
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamily.body,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  divider: {
    height: 1,
    marginLeft: spacing.md,
  },
  logoutRow: {
    backgroundColor: "transparent",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EF4444",
    fontFamily: typography.fontFamily.body,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing["2xl"],
    paddingBottom: spacing.screenPadding,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: typography.fontFamily.body,
  },
});

export default SettingsScreen;
