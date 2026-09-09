import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useNotificationStore, AppNotification } from "../stores/notificationStore";
import * as notificationsApi from "../api/notifications";
import { colors, spacing, typography, radius, useThemedColors } from "../theme";
import { format } from "date-fns";

const ICON_MAP: Record<
  AppNotification["type"],
  { name: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }
> = {
  spending_alert_100: { name: "alert-circle", color: "#EF4444", bg: "#EF444420", label: "Budget Alert" },
  spending_alert_80: { name: "warning", color: "#F59E0B", bg: "#F59E0B20", label: "Budget Warning" },
  weekly_report: { name: "bar-chart", color: colors.primary, bg: `${colors.primary}20`, label: "Weekly Report" },
  check_in: { name: "checkmark-circle", color: "#10B981", bg: "#10B98120", label: "Check-in" },
  general: { name: "information-circle", color: colors.primary, bg: `${colors.primary}20`, label: "Notification" },
};

const NotificationDetailScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { notificationId } = route.params as { notificationId: string };

  const { notifications, markRead } = useNotificationStore();
  const notification = notifications.find((n) => n._id === notificationId);

  useEffect(() => {
    if (notification && !notification.isRead) {
      notificationsApi.markNotificationRead(notificationId).catch(() => {});
      markRead(notificationId);
    }
  }, [notificationId]);

  if (!notification) {
    return (
      <ScreenContainer backgroundColor={themedColors.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFoundText, { color: themedColors.textSecondary }]}>
            Notification not found.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const icon = ICON_MAP[notification.type] ?? ICON_MAP.general;

  const formattedDate = (() => {
    try {
      return format(new Date(notification.createdAt), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "";
    }
  })();

  const hasAction =
    notification.data?.screen === "ChatHistory" ||
    notification.data?.screen === "WeeklyReport";

  const handleAction = () => {
    if (notification.data?.screen === "ChatHistory") {
      navigation.navigate("Main", { screen: "ChatHistory" });
    } else if (notification.data?.screen === "WeeklyReport" && notification.data?.reportId) {
      navigation.navigate("WeeklyReport", { reportId: notification.data.reportId });
    }
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>
          Notification
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon + type */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={36} color={icon.color} />
          </View>
          <View style={[styles.typeBadge, { backgroundColor: icon.bg }]}>
            <Text style={[styles.typeText, { color: icon.color }]}>{icon.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>
          {notification.title}
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: themedColors.textSecondary }]}>{formattedDate}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: themedColors.border }]} />

        {/* Body */}
        <Text style={[styles.body, { color: themedColors.textPrimary }]}>{notification.body}</Text>

        {/* Action button */}
        {hasAction && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleAction}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {notification.data?.screen === "ChatHistory"
                ? "Open Coach"
                : "View Report"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
    textAlign: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: typography.fontFamily.body,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: typography.fontFamily.body,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: typography.fontFamily.display,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.body,
  },
});

export default NotificationDetailScreen;
