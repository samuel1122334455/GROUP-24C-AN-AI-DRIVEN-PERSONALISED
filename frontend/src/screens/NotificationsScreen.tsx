import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useNotificationStore, AppNotification } from "../stores/notificationStore";
import * as notificationsApi from "../api/notifications";
import { colors, spacing, typography, radius, useThemedColors } from "../theme";
import { formatDistanceToNow } from "date-fns";

type NotifIcon = { name: keyof typeof Ionicons.glyphMap; color: string; bg: string };

const ICON_MAP: Record<AppNotification["type"], NotifIcon> = {
  spending_alert_100: { name: "alert-circle", color: "#EF4444", bg: "#EF444420" },
  spending_alert_80: { name: "warning", color: "#F59E0B", bg: "#F59E0B20" },
  weekly_report: { name: "bar-chart", color: colors.primary, bg: `${colors.primary}20` },
  check_in: { name: "checkmark-circle", color: "#10B981", bg: "#10B98120" },
  general: { name: "information-circle", color: colors.primary, bg: `${colors.primary}20` },
};

const NotifRow = ({
  item,
  onPress,
  themedColors,
}: {
  item: AppNotification;
  onPress: () => void;
  themedColors: any;
}) => {
  const icon = ICON_MAP[item.type] ?? ICON_MAP.general;
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: item.isRead ? themedColors.surface : `${colors.primary}0D`,
          borderColor: themedColors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.rowTitle,
              { color: themedColors.textPrimary },
              !item.isRead && styles.rowTitleBold,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text
          style={[styles.rowBody, { color: themedColors.textSecondary }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={[styles.rowTime, { color: themedColors.textSecondary }]}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { notifications, unreadCount, isLoading, setNotifications, markAllRead, setLoading } =
    useNotificationStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.fetchNotifications();
      setNotifications(data.notifications, data.unreadCount);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllNotificationsRead();
      markAllRead();
    } catch { }
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>
          Notifications
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markBtn}>
            <Text style={[styles.markBtnText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="notifications-off-outline" size={48} color={themedColors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: themedColors.textPrimary }]}>
                All caught up!
              </Text>
              <Text style={[styles.emptyBody, { color: themedColors.textSecondary }]}>
                Your notifications will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotifRow
              item={item}
              themedColors={themedColors}
              onPress={() =>
                navigation.navigate("NotificationDetail", { notificationId: item._id })
              }
            />
          )}
        />
      )}
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
  markBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markBtnText: { fontSize: 13, fontWeight: "600", fontFamily: typography.fontFamily.body },
  list: { padding: spacing.md, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  rowTitleBold: { fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rowBody: { fontSize: 13, lineHeight: 18, fontFamily: typography.fontFamily.body },
  rowTime: { fontSize: 11, fontFamily: typography.fontFamily.body, marginTop: 2 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: typography.fontFamily.body,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
