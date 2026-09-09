/**
 * Dashboard Screen
 * Main home screen showing daily spending, budget, and transactions
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabScreenProps } from "../navigation/types";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  useThemedColors,
} from "../theme";
import Svg, { Circle } from "react-native-svg";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useUserStore } from "../stores/userStore";
import { useTransactionStore } from "../stores/transactionStore";
import { useNotificationStore } from "../stores/notificationStore";
import * as userApi from "../api/user";
import * as notificationsApi from "../api/notifications";
import { getCurrencySymbol } from "../utils/currency";

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isPrimary?: boolean;
  onPress?: () => void;
}

const QuickAction = ({ icon, label, isPrimary, onPress }: QuickActionProps) => {
  const themedColors = useThemedColors();
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: themedColors.surface },
        isPrimary && styles.actionButtonPrimary,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={28}
        color={isPrimary ? "#FFFFFF" : colors.accent}
      />
      <Text
        style={[
          styles.actionLabel,
          { color: themedColors.textPrimary },
          isPrimary && styles.actionLabelPrimary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const TransactionItem = ({ item, onPress, symbol }: { item: any; onPress: () => void; symbol: string }) => {
  const themedColors = useThemedColors();
  return (
    <TouchableOpacity
      style={[
        styles.transactionCard,
        {
          backgroundColor: themedColors.surface,
          borderColor: themedColors.border,
        },
      ]}
      onPress={onPress}
    >
        <View style={styles.transactionIcon}>
            <Ionicons name={getCategoryIcon(item.category)} size={24} color={colors.primary} />
        </View>
        <View style={styles.transactionContent}>
            <Text style={[styles.transactionTitle, { color: themedColors.textPrimary }]}>{item.description}</Text>
            <Text style={[styles.transactionMeta, { color: themedColors.textSecondary }]}>
                {item.category} • {item.mood || 'Neutral'}
            </Text>
        </View>
        <Text style={[styles.transactionAmount, { color: themedColors.textPrimary }]}>
            -{symbol}{item.amount.toFixed(2)}
        </Text>
    </TouchableOpacity>
  );
};

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch(category.toLowerCase()) {
        case 'food': return 'restaurant';
        case 'transport': return 'car';
        case 'shopping': return 'cart';
        case 'bills': return 'receipt';
        case 'entertainment': return 'game-controller';
        default: return 'card';
    }
}

// Minimum ms between background fetches — prevents StrictMode double-fire
// and rapid focus events from hammering the API.
const MIN_FETCH_INTERVAL_MS = 15_000;

const DashboardScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<MainTabScreenProps<"Dashboard">["navigation"]>();
  const { user, spendingSummary } = useUserStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { unreadCount, setNotifications } = useNotificationStore();

  // Throttle ref — only used internally, not reactive state
  const lastFetchedAt = useRef<number>(0);
  // Separate manual-refresh spinner so the auto-background load never shows the indicator
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (now - lastFetchedAt.current < MIN_FETCH_INTERVAL_MS) return;
      lastFetchedAt.current = now;

      const load = async () => {
        // Fire-and-forget transactions — don't await so it doesn't block summary/notifications
        fetchTransactions().catch(() => {});
        try {
          const summary = await userApi.getSpendingSummary();
          useUserStore.getState().setSpendingSummary(summary);
        } catch (e: any) {
          console.log("[Dashboard] spending-summary fetch failed:", e?.message);
        }
        try {
          const notifData = await notificationsApi.fetchNotifications();
          setNotifications(notifData.notifications, notifData.unreadCount);
        } catch (e: any) {
          console.log("[Dashboard] notifications fetch failed:", e?.message);
        }
      };
      load();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    lastFetchedAt.current = 0; // reset throttle so the manual refresh always fires
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        fetchTransactions(),
        userApi.getSpendingSummary().then((s) => useUserStore.getState().setSpendingSummary(s)),
        notificationsApi.fetchNotifications().then((d) => setNotifications(d.notifications, d.unreadCount)),
      ]);
    } catch (e: any) {
      console.log("[Dashboard] manual refresh failed:", e?.message);
    } finally {
      setIsManualRefreshing(false);
    }
  }, []);

  const firstName = user?.name?.split(" ")?.[0] || "Friend";
  const symbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");

  const budgetLimit = spendingSummary?.budgetLimit || 100;
  const totalSpent = spendingSummary?.totalSpent || 0;
  // logic: percentage of budget used
  const progress = Math.min(
    100,
    Math.max(0, (totalSpent / Math.max(1, budgetLimit)) * 100)
  );
  
  const isOverBudget = totalSpent > budgetLimit;
  const progressColor = isOverBudget ? colors.error : colors.primary;

  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScreenContainer
      backgroundColor={themedColors.background}
      withKeyboardAvoidingView={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text
            style={[styles.dateText, { color: themedColors.textSecondary }]}
          >
            {getCurrentDate()}
          </Text>
          <Text style={[styles.greeting, { color: themedColors.textPrimary }]}>
            Hi, {firstName}! 💰
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bellBtn, { backgroundColor: themedColors.surface }]}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications" size={22} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero Summary Card */}
        <View
          style={[styles.heroCard, { backgroundColor: themedColors.surface }]}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: themedColors.textPrimary }]}>Daily Budget</Text>
                <View style={[styles.statusBadge, { backgroundColor: isOverBudget ? `${colors.error}1A` : `${colors.primary}1A` }]}>
                    <Text style={[styles.statusText, { color: isOverBudget ? colors.error : colors.primary }]}>
                        {isOverBudget ? "Over Budget" : "On Track"}
                    </Text>
                </View>
            </View>

          <View style={styles.progressRingContainer}>
            {/* SVG Progress Ring */}
            <Svg width={264} height={264} style={styles.progressRing}>
              <Circle
                cx="132"
                cy="132"
                r={radius}
                stroke={themedColors.surfaceLight}
                strokeWidth="16"
                fill="transparent"
              />
              <Circle
                cx="132"
                cy="132"
                r={radius}
                stroke={progressColor}
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="132, 132"
              />
            </Svg>

            {/* Inner Content */}
            <View style={styles.progressContent}>
              <Text style={[styles.spentLabel, { color: themedColors.textSecondary }]}>
                Spent
              </Text>
              <Text style={[styles.spentAmount, { color: themedColors.textPrimary }]}>
                {symbol}{totalSpent.toFixed(2)}
              </Text>
              <View style={[styles.ringDivider, { backgroundColor: themedColors.border }]} />
              <Text
                style={[
                  styles.amountLeft,
                  { color: isOverBudget ? colors.error : "#10B981" },
                ]}
              >
                {isOverBudget
                  ? `${symbol}${(totalSpent - budgetLimit).toFixed(2)} over`
                  : `${symbol}${(budgetLimit - totalSpent).toFixed(2)} left`}
              </Text>
              <Text style={[styles.budgetMeta, { color: themedColors.textSecondary }]}>
                of {symbol}{budgetLimit} daily
              </Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
              <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.warning }]}>{spendingSummary?.emotionalSpendingCount || 0}</Text>
                  <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Emotional Buys</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>{spendingSummary?.topTrigger || 'None'}</Text>
                  <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Top Trigger</Text>
              </View>
          </View>

        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: themedColors.textPrimary }]}
          >
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="add"
              label="Log Spend"
              isPrimary
              onPress={() => navigation.navigate("LogTransaction")}
            />
            <QuickAction
                icon="chatbubbles"
                label="Coach"
                onPress={() => navigation.navigate("ChatHistory")}
            />
            <QuickAction icon="scan" label="Scan Receipt" onPress={() => navigation.navigate("ScanReceipt")} />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: themedColors.textPrimary }]}
            >
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllTransactions")}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsContainer}>
            {recentTransactions.length === 0 ? (
                <Text style={{ color: themedColors.textSecondary, textAlign: 'center', padding: 20 }}>
                    No transactions today. Good job saving!
                </Text>
            ) : (
                recentTransactions.map((t) => (
                    <TransactionItem
                        key={t._id}
                        item={t}
                        symbol={symbol}
                        onPress={() => navigation.navigate("TransactionDetail", { transactionId: t._id })} 
                    />
                ))
            )}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: typography.fontFamily.body,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
    fontFamily: typography.fontFamily.display,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: `${colors.primary}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    fontFamily: typography.fontFamily.display,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  heroCard: {
    borderRadius: radius["3xl"],
    padding: spacing.screenPadding,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: typography.fontFamily.display,
  },
  progressRingContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressRing: {
    position: "absolute",
  },
  progressContent: {
    width: 264,
    height: 264,
    alignItems: "center",
    justifyContent: "center",
  },
  spentLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily.body,
    marginBottom: 2,
  },
  spentAmount: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: typography.fontFamily.display,
  },
  ringDivider: {
    width: 40,
    height: 1,
    marginVertical: 6,
  },
  amountLeft: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  budgetMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    fontFamily: typography.fontFamily.body,
  },
  statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: spacing.sm,
  },
  statItem: {
      alignItems: 'center',
  },
  statValue: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 2,
  },
  statLabel: {
      fontSize: 12,
  },
  statDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
    paddingLeft: 4,
    fontFamily: typography.fontFamily.display,
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: typography.fontFamily.display,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: `${colors.textPrimaryDark}0D`,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    ...shadows.lg,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  actionLabelPrimary: {
    color: "#FFFFFF",
  },
  transactionsContainer: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 16,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    ...shadows.sm,
  },
  transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${colors.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  transactionMeta: {
    fontSize: 12,
  },
  transactionAmount: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: typography.fontFamily.display,
  }
});

export default DashboardScreen;
