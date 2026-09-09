/**
 * All Transactions Screen
 * Full list of transactions grouped by date with filter chips
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { colors, spacing, typography, radius, shadows, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useTransactionStore } from "../stores/transactionStore";

const FILTERS = ["All", "Emotional", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category.toLowerCase()) {
    case "food": return "restaurant";
    case "transport": return "car";
    case "shopping": return "cart";
    case "bills": return "receipt";
    case "entertainment": return "game-controller";
    case "health": return "medical";
    default: return "card";
  }
};

const AllTransactionsScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Emotional") return t.mood && t.mood !== "neutral";
    return t.category.toLowerCase() === activeFilter.toLowerCase();
  });

  // Group by date
  const grouped: { dateLabel: string; total: number; items: typeof transactions }[] = [];
  const seen: Record<string, number> = {};

  for (const t of filtered) {
    const dateLabel = format(new Date(t.date), "MMM d, yyyy");
    if (seen[dateLabel] === undefined) {
      seen[dateLabel] = grouped.length;
      grouped.push({ dateLabel, total: 0, items: [] });
    }
    const g = grouped[seen[dateLabel]];
    g.items.push(t);
    g.total += t.amount;
  }

  type ListItem =
    | { type: "header"; dateLabel: string; total: number }
    | { type: "row"; transaction: (typeof transactions)[0] };

  const listData: ListItem[] = grouped.flatMap((g) => [
    { type: "header" as const, dateLabel: g.dateLabel, total: g.total },
    ...g.items.map((t) => ({ type: "row" as const, transaction: t })),
  ]);

  return (
    <ScreenContainer backgroundColor={themedColors.background} withKeyboardAvoidingView={false}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>All Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: themedColors.border, backgroundColor: themedColors.surface },
              activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, { color: activeFilter === f ? "#fff" : themedColors.textSecondary }]}>
              {f}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === "header" ? `h-${item.dateLabel}` : `r-${item.transaction._id}-${i}`
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTransactions} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={themedColors.textSecondary} />
            <Text style={[styles.emptyText, { color: themedColors.textSecondary }]}>
              No transactions yet. Start logging your spending!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={[styles.dateHeader, { borderBottomColor: themedColors.border }]}>
                <Text style={[styles.dateLabel, { color: themedColors.textSecondary }]}>{item.dateLabel}</Text>
                <Text style={[styles.dateTotal, { color: themedColors.textPrimary }]}>
                  ${item.total.toFixed(2)}
                </Text>
              </View>
            );
          }
          const t = item.transaction;
          return (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}
              onPress={() => navigation.navigate("TransactionDetail", { transactionId: t._id })}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name={getCategoryIcon(t.category)} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
                  {t.description}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowCategory, { color: themedColors.textSecondary }]}>{t.category}</Text>
                  {t.mood && t.mood !== "neutral" && (
                    <View style={[styles.moodBadge, { backgroundColor: `${colors.warning}22` }]}>
                      <Text style={[styles.moodText, { color: colors.warning }]}>{t.mood}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.rowAmount, { color: themedColors.textPrimary }]}>
                -${t.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", fontFamily: typography.fontFamily.display },
  filterBar: { maxHeight: 52 },
  filterContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  dateHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  dateLabel: { fontSize: 13, fontWeight: "600" },
  dateTotal: { fontSize: 13, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    marginHorizontal: spacing.md, marginVertical: 4, padding: 14,
    borderRadius: radius["2xl"], borderWidth: 1, ...shadows.sm,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowCategory: { fontSize: 12 },
  moodBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  moodText: { fontSize: 11, fontWeight: "600" },
  rowAmount: { fontSize: 15, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 80 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl },
});

export default AllTransactionsScreen;
