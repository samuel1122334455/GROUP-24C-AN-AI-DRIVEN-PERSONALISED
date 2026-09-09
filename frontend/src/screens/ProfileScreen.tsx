/**
 * Profile Screen
 * User financial profile with details, goals, and risk tolerance
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  useThemedColors,
} from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useUserStore } from "../stores/userStore";
import * as userApi from "../api/user";
import { useNavigation } from "@react-navigation/native";
import * as reportsApi from "../api/reports";
import { WeeklyReportSummary } from "../types/report";
import { getCurrencySymbol } from "../utils/currency";

type FinancialGoal = "save_emergency" | "pay_debt" | "invest" | "budget_control";
type RiskTolerance = "conservative" | "moderate" | "aggressive";

const ProfileScreen = () => {
  const themedColors = useThemedColors();
  const { user, updateProfile, setUser, setSpendingSummary } = useUserStore();
  const { showAlert } = useAlertStore();
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal>("save_emergency");
  const [editingField, setEditingField] = useState<"name" | "income" | "age" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("moderate");
  const [spendingCategories, setSpendingCategories] = useState<string[]>([]);
  const categoryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<WeeklyReportSummary[]>([]);

  useEffect(() => {
    reportsApi.getReports().then(setReports).catch(() => {});
  }, []);

  const symbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");

  // Update local state when user loads
  useEffect(() => {
    if (!user?.profile) return;
    if (user.profile.primaryGoal) setSelectedGoal(user.profile.primaryGoal);
    if (user.profile.riskTolerance) setRiskTolerance(user.profile.riskTolerance);
    if (user.profile.spendingCategories) setSpendingCategories(user.profile.spendingCategories);
  }, [user]);

  // Handle updates
  const handleGoalChange = async (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    updateProfile({ primaryGoal: goal });
    try {
      await userApi.updateProfile({ profile: { primaryGoal: goal } });
    } catch {
      setSelectedGoal(user?.profile?.primaryGoal ?? "save_emergency");
      updateProfile({ primaryGoal: user?.profile?.primaryGoal ?? "save_emergency" });
      showAlert("Error", "Failed to save goal. Please try again.");
    }
  };

  const handleRiskChange = async (risk: RiskTolerance) => {
    setRiskTolerance(risk);
    updateProfile({ riskTolerance: risk });
    try {
      await userApi.updateProfile({ profile: { riskTolerance: risk } });
    } catch {
      setRiskTolerance(user?.profile?.riskTolerance ?? "moderate");
      updateProfile({ riskTolerance: user?.profile?.riskTolerance ?? "moderate" });
      showAlert("Error", "Failed to save risk tolerance. Please try again.");
    }
  };

  const toggleCategory = (cat: string) => {
    let newCats: string[];
    if (spendingCategories.includes(cat)) {
      newCats = spendingCategories.filter((c) => c !== cat);
    } else {
      newCats = [...spendingCategories, cat];
    }
    setSpendingCategories(newCats);
    updateProfile({ spendingCategories: newCats });

    if (categoryDebounce.current) clearTimeout(categoryDebounce.current);
    categoryDebounce.current = setTimeout(async () => {
      try {
        await userApi.updateProfile({ profile: { spendingCategories: newCats } });
      } catch {
        const original = user?.profile?.spendingCategories ?? [];
        setSpendingCategories(original);
        updateProfile({ spendingCategories: original });
        showAlert("Error", "Failed to save categories. Please try again.");
      }
    }, 500);
  };

  const handleStartEdit = (field: "name" | "income" | "age") => {
    setEditingField(field);
    setEditValue(
      field === "name" ? user?.name ?? "" :
      field === "income" ? String(user?.profile?.monthlyIncome ?? "") :
      String(user?.profile?.age ?? "")
    );
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingField || isSaving) return;
    setIsSaving(true);
    try {
      if (editingField === "name") {
        const trimmed = editValue.trim();
        if (!trimmed || trimmed.length < 2) {
          showAlert("Invalid", "Name must be at least 2 characters.");
          return;
        }
        const updated = await userApi.updateProfile({ name: trimmed });
        setUser(updated);
      } else if (editingField === "income") {
        const val = parseFloat(editValue);
        if (isNaN(val) || val < 0) {
          showAlert("Invalid", "Please enter a valid income amount.");
          return;
        }
        updateProfile({ monthlyIncome: val });
        const updated = await userApi.updateProfile({ profile: { monthlyIncome: val } });
        setUser(updated);
        // Refresh spending summary so dashboard budget limit updates immediately
        try {
          const summary = await userApi.getSpendingSummary();
          setSpendingSummary(summary);
        } catch { /* non-critical */ }
      } else if (editingField === "age") {
        const val = parseInt(editValue, 10);
        if (isNaN(val) || val < 13 || val > 120) {
          showAlert("Invalid", "Please enter a valid age between 13 and 120.");
          return;
        }
        updateProfile({ age: val });
        const updated = await userApi.updateProfile({ profile: { age: val } });
        setUser(updated);
      }
      setEditingField(null);
      setEditValue("");
    } catch {
      showAlert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const memberSinceLabel = useMemo(() => {
    if (!user?.createdAt) return undefined;
    const d = new Date(user.createdAt);
    return `Member since ${d.toLocaleDateString()}`;
  }, [user?.createdAt]);

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
        <Text
          style={[
            styles.title,
            {
              color: themedColors.textPrimary,
              fontFamily: typography.fontFamily.display,
            },
          ]}
        >
          Profile
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=2D9CDB&color=fff" }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => handleStartEdit("name")}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {editingField === "name" ? (
            <View style={styles.nameEditRow}>
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                style={[styles.nameInput, { color: themedColors.textPrimary, borderColor: colors.primary }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
                placeholder="Your name"
                placeholderTextColor={themedColors.textSecondary}
              />
              <View style={styles.editActions}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <TouchableOpacity onPress={handleCancelEdit} style={styles.editActionBtn}>
                      <Ionicons name="close" size={20} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveEdit} style={styles.editActionBtn}>
                      <Ionicons name="checkmark" size={20} color={colors.success} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : (
            <Text style={[styles.userName, { color: themedColors.textPrimary }]}>
              {user?.name || "Financial User"}
            </Text>
          )}
          <View style={styles.memberInfo}>
            <Text
              style={[styles.memberText, { color: themedColors.textSecondary }]}
            >
              {memberSinceLabel || "Just joined"}
            </Text>
          </View>
        </View>

        {/* The Basics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: themedColors.textPrimary }]}
            >
              Financial Stats
            </Text>
          </View>
          <View style={styles.statsGrid}>
            {/* Age Card */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: themedColors.surface, borderColor: editingField === "age" ? colors.primary : themedColors.border }]}
              onPress={() => editingField !== "age" && handleStartEdit("age")}
              activeOpacity={0.8}
            >
              <Text style={styles.statEmoji}>🎂</Text>
              <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>AGE</Text>
              {editingField === "age" ? (
                <View style={styles.cardEditArea}>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    style={[styles.cardInput, { color: themedColors.textPrimary }]}
                    autoFocus
                    maxLength={3}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveEdit}
                  />
                  <View style={styles.cardEditBtns}>
                    {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : (
                      <>
                        <TouchableOpacity onPress={handleCancelEdit}><Ionicons name="close-circle" size={20} color={colors.error} /></TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveEdit}><Ionicons name="checkmark-circle" size={20} color={colors.success} /></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.cardValueRow}>
                  <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>
                    {user?.profile?.age ?? "—"}
                  </Text>
                  <Ionicons name="pencil" size={11} color={colors.primary} style={{ marginLeft: 4, marginTop: 4 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Income Card */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: themedColors.surface, borderColor: editingField === "income" ? colors.primary : themedColors.border }]}
              onPress={() => editingField !== "income" && handleStartEdit("income")}
              activeOpacity={0.8}
            >
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>INCOME/MO</Text>
              {editingField === "income" ? (
                <View style={styles.cardEditArea}>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    style={[styles.cardInput, { color: themedColors.textPrimary }]}
                    autoFocus
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveEdit}
                  />
                  <View style={styles.cardEditBtns}>
                    {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : (
                      <>
                        <TouchableOpacity onPress={handleCancelEdit}><Ionicons name="close-circle" size={20} color={colors.error} /></TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveEdit}><Ionicons name="checkmark-circle" size={20} color={colors.success} /></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.cardValueRow}>
                  <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>
                    ${(user?.profile?.monthlyIncome ?? 0).toLocaleString()}
                  </Text>
                  <Ionicons name="pencil" size={11} color={colors.primary} style={{ marginLeft: 4, marginTop: 4 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>
            Primary Goal
          </Text>
          <View style={[styles.goalsContainer, { backgroundColor: themedColors.surface }]}>
              {/* Emergency Fund */}
              <TouchableOpacity
                style={[
                    styles.goalOption,
                    { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                    selectedGoal === 'save_emergency' && styles.goalOptionSelected
                ]}
                onPress={() => handleGoalChange('save_emergency')}
              >
                  <View style={[styles.goalIcon, { backgroundColor: `${colors.primary}33` }]}>
                      <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.goalContent}>
                      <Text style={[styles.goalTitle, { color: themedColors.textPrimary }]}>Emergency Fund</Text>
                      <Text style={[styles.goalDescription, { color: themedColors.textSecondary }]}>Build 3-6 months safety net</Text>
                  </View>
                  {selectedGoal === 'save_emergency' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>

              {/* Pay Debt */}
              <TouchableOpacity
                style={[
                    styles.goalOption,
                    { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                    selectedGoal === 'pay_debt' && styles.goalOptionSelected
                ]}
                onPress={() => handleGoalChange('pay_debt')}
              >
                  <View style={[styles.goalIcon, { backgroundColor: `${colors.error}33` }]}>
                      <Ionicons name="trending-down" size={24} color={colors.error} />
                  </View>
                  <View style={styles.goalContent}>
                      <Text style={[styles.goalTitle, { color: themedColors.textPrimary }]}>Pay Off Debt</Text>
                      <Text style={[styles.goalDescription, { color: themedColors.textSecondary }]}>Focus on high-interest loans</Text>
                  </View>
                   {selectedGoal === 'pay_debt' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
              
              {/* Invest */}
              <TouchableOpacity
                style={[
                    styles.goalOption,
                    { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                    selectedGoal === 'invest' && styles.goalOptionSelected
                ]}
                onPress={() => handleGoalChange('invest')}
              >
                  <View style={[styles.goalIcon, { backgroundColor: `${colors.success}33` }]}>
                      <Ionicons name="trending-up" size={24} color={colors.success} />
                  </View>
                  <View style={styles.goalContent}>
                      <Text style={[styles.goalTitle, { color: themedColors.textPrimary }]}>Invest Wealth</Text>
                      <Text style={[styles.goalDescription, { color: themedColors.textSecondary }]}>Grow net worth over time</Text>
                  </View>
                   {selectedGoal === 'invest' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
              
               {/* Budget Control */}
              <TouchableOpacity
                style={[
                    styles.goalOption,
                    { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                    selectedGoal === 'budget_control' && styles.goalOptionSelected
                ]}
                onPress={() => handleGoalChange('budget_control')}
              >
                  <View style={[styles.goalIcon, { backgroundColor: `${colors.accent}33` }]}>
                      <Ionicons name="wallet" size={24} color={colors.accent} />
                  </View>
                  <View style={styles.goalContent}>
                      <Text style={[styles.goalTitle, { color: themedColors.textPrimary }]}>Budget Control</Text>
                      <Text style={[styles.goalDescription, { color: themedColors.textSecondary }]}>Stop living paycheck to paycheck</Text>
                  </View>
                   {selectedGoal === 'budget_control' && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
          </View>
        </View>

        {/* Risk Tolerance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>
            Risk Tolerance
          </Text>
           <View style={{ flexDirection: 'row', gap: 12 }}>
               {['conservative', 'moderate', 'aggressive'].map((level) => (
                   <TouchableOpacity 
                    key={level}
                    style={[
                        styles.riskCard, 
                        { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                        riskTolerance === level && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => handleRiskChange(level as RiskTolerance)}
                   >
                       <Text style={{ fontSize: 24, marginBottom: 8 }}>
                           {level === 'conservative' ? '🛡️' : level === 'moderate' ? '⚖️' : '🚀'}
                       </Text>
                       <Text style={[styles.riskLabel, { color: themedColors.textPrimary }]}>
                           {level.charAt(0).toUpperCase() + level.slice(1)}
                       </Text>
                   </TouchableOpacity>
               ))}
           </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>
            Spending Categories
          </Text>
          <View style={[styles.preferencesContainer, { backgroundColor: themedColors.surface }]}>
            {[
              { emoji: "🍔", label: "Food" },
              { emoji: "🚌", label: "Transport" },
              { emoji: "💊", label: "Health" },
              { emoji: "🛍️", label: "Shopping" },
              { emoji: "💡", label: "Bills" },
              { emoji: "🎮", label: "Fun" },
            ].map((pref) => (
              <TouchableOpacity
                key={pref.label}
                style={[
                  styles.preferenceChip,
                  {
                    backgroundColor: themedColors.surfaceLight,
                    borderColor: themedColors.border,
                  },
                  spendingCategories.includes(pref.label) && styles.preferenceChipActive,
                ]}
                onPress={() => toggleCategory(pref.label)}
              >
                <Text style={styles.preferenceEmoji}>{pref.emoji}</Text>
                <Text
                  style={[
                    styles.preferenceLabel,
                    { color: themedColors.textPrimary },
                    spendingCategories.includes(pref.label) && styles.preferenceLabelActive,
                  ]}
                >
                  {pref.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>
            Past Reports
          </Text>
          {reports.length === 0 ? (
            <Text style={{ color: themedColors.textSecondary, fontSize: 14, paddingLeft: 4 }}>
              Your weekly reports will appear here.
            </Text>
          ) : (
            <View style={[{ backgroundColor: themedColors.surface, borderRadius: 16 }]}>
              {reports.map((r, i) => {
                const start = new Date(r.weekStart).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const end = new Date(r.weekEnd).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <TouchableOpacity
                    key={r._id}
                    style={[
                      styles.reportRow,
                      { borderBottomColor: themedColors.border },
                      i === reports.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => navigation.navigate("WeeklyReport", { reportId: r._id })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reportDate, { color: themedColors.textPrimary }]}>
                        {start} – {end}
                      </Text>
                      <Text style={[styles.reportMeta, { color: themedColors.textSecondary }]}>
                        {r.txCount} transactions · {symbol}{r.totalSpent.toFixed(2)} spent
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.screenPadding,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.surfaceDark,
    ...shadows.lg,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.backgroundDark,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: typography.fontFamily.display,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
    paddingLeft: 4,
    fontFamily: typography.fontFamily.display,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    ...shadows.sm,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    fontFamily: typography.fontFamily.body,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    fontFamily: typography.fontFamily.display,
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardEditArea: {
    alignItems: "center",
    marginTop: 4,
    width: "100%",
  },
  cardInput: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
    borderBottomWidth: 1.5,
    borderColor: colors.primary,
    textAlign: "center",
    paddingVertical: 2,
    width: "100%",
  },
  cardEditBtns: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  nameEditRow: {
    alignItems: "center",
    width: "80%",
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
    borderBottomWidth: 1.5,
    textAlign: "center",
    paddingVertical: 4,
    width: "100%",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editActionBtn: {
    padding: 4,
  },
  goalsContainer: {
    gap: 12,
    padding: spacing.sm,
    borderRadius: radius.xl,
  },
  goalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
      gap: spacing.md,
  },
  goalOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}1A`, // slightly highlighted
  },
  goalIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
  },
  goalContent: {
      flex: 1,
  },
  goalTitle: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: typography.fontFamily.display,
  },
  goalDescription: {
      fontSize: 12,
      fontFamily: typography.fontFamily.body,
  },
  riskCard: {
      flex: 1,
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
  },
  riskLabel: {
      fontWeight: '700',
      fontSize: 14,
  },
  preferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius["2xl"],
  },
  preferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 6,
  },
  preferenceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  preferenceEmoji: {
    fontSize: 16,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: typography.fontFamily.body,
  },
  preferenceLabelActive: {
    color: "#FFFFFF",
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: typography.fontFamily.display,
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: 12,
    fontFamily: typography.fontFamily.body,
  },
});

export default ProfileScreen;
