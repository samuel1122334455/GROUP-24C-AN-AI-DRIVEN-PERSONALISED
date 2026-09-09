import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, useThemedColors } from "../theme";
import { useUserStore } from "../stores/userStore";
import { useAlertStore } from "../stores/alertStore";
import * as userApi from "../api/user";
import { CurrencyPicker } from "../components/common/CurrencyPicker";
import {
  getCurrencySymbol,
  generateProjectionData,
  getGoalTimelineLabel,
} from "../utils/currency";
import { LineChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TOTAL_STEPS = 7;

type FinancialGoal = "save_emergency" | "pay_debt" | "invest" | "budget_control";
type RiskTolerance = "conservative" | "moderate" | "aggressive";

interface Answers {
  currency: string;
  income: number;
  savings: number;
  age: number;
  goal: FinancialGoal;
  risk: RiskTolerance;
  categories: string[];
}

const GOAL_OPTIONS: { value: FinancialGoal; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: "save_emergency", label: "Emergency Fund", icon: "shield-checkmark", color: colors.primary },
  { value: "pay_debt",       label: "Pay Off Debt",   icon: "trending-down",    color: colors.error },
  { value: "invest",         label: "Invest Wealth",  icon: "trending-up",      color: colors.success },
  { value: "budget_control", label: "Budget Control", icon: "wallet",           color: colors.accent },
];

const RISK_OPTIONS: { value: RiskTolerance; label: string; emoji: string; desc: string }[] = [
  { value: "conservative", label: "Conservative", emoji: "🛡️", desc: "Low risk, steady growth" },
  { value: "moderate",     label: "Moderate",     emoji: "⚖️", desc: "Balanced approach" },
  { value: "aggressive",   label: "Aggressive",   emoji: "🚀", desc: "High risk, high reward" },
];

const CATEGORY_OPTIONS = [
  { label: "Food",      emoji: "🍔" },
  { label: "Transport", emoji: "🚌" },
  { label: "Health",    emoji: "💊" },
  { label: "Shopping",  emoji: "🛍️" },
  { label: "Bills",     emoji: "💡" },
  { label: "Fun",       emoji: "🎮" },
];

const GOAL_NAMES: Record<FinancialGoal, string> = {
  save_emergency: "Emergency Fund",
  pay_debt:       "Debt Freedom",
  invest:         "Wealth Building",
  budget_control: "Budget Mastery",
};

const ANALYSIS_STEPS = [
  "Mapping your income...",
  "Calculating daily budget...",
  "Aligning your goals...",
  "Building your plan...",
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ step, themedColors }: { step: number; themedColors: any }) => (
  <View style={pb.row}>
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <View key={i} style={[pb.seg, { backgroundColor: i <= step ? colors.primary : themedColors.border }]} />
    ))}
  </View>
);
const pb = StyleSheet.create({
  row: { flexDirection: "row", gap: 4, flex: 1 },
  seg: { flex: 1, height: 3, borderRadius: 2 },
});

// ─── Helper sub-components ────────────────────────────────────────────────────

const QuestionCard = ({
  question, sub, children, themedColors,
}: {
  question: string; sub: string; children: React.ReactNode; themedColors: any;
}) => (
  <View style={styles.questionCard}>
    <View style={styles.questionText}>
      <Text style={[styles.question, { color: themedColors.textPrimary }]}>{question}</Text>
      <Text style={[styles.questionSub, { color: themedColors.textSecondary }]}>{sub}</Text>
    </View>
    <View style={styles.inputArea}>{children}</View>
  </View>
);

const AmountInput = ({
  symbol, value, onChange, onSubmit, themedColors, placeholder,
}: {
  symbol: string; value: string; onChange: (v: string) => void;
  onSubmit: () => void; themedColors: any; placeholder?: string;
}) => (
  <View style={styles.amountRow}>
    {!!symbol && <Text style={[styles.amountSymbol, { color: colors.primary }]}>{symbol}</Text>}
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholder={placeholder ?? "0"}
      placeholderTextColor={themedColors.textSecondary}
      style={[styles.amountInput, { color: themedColors.textPrimary, borderBottomColor: colors.primary }]}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      autoFocus
    />
  </View>
);

const NextBtn = ({ onPress, label = "Continue" }: { onPress: () => void; label?: string }) => (
  <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={onPress}>
    <Text style={styles.nextBtnText}>{label}</Text>
    <Ionicons name="arrow-forward" size={18} color="#fff" />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const OnboardingScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUserStore();
  const { showAlert } = useAlertStore();

  const [step, setStep] = useState(0);           // 0-6 = questions, 7 = analyzing, 8 = results
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [inputValue, setInputValue] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const slideX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const symbol = getCurrencySymbol(answers.currency ?? "USD");

  const slideIn = () => {
    slideX.setValue(SCREEN_WIDTH);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const advance = (newAnswers: Partial<Answers>, nextStep: number) => {
    setAnswers(newAnswers);
    Animated.timing(slideX, {
      toValue: -SCREEN_WIDTH,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setInputValue("");
      setStep(nextStep);
      slideIn();
    });
  };

  useEffect(() => { slideIn(); }, []);

  // Fake analysis progress
  useEffect(() => {
    if (step !== 7) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setAnalysisStep(i);
      if (i >= ANALYSIS_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStep(8);
          slideIn();
        }, 700);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [step]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleBack = () => {
    if (step === 0) return;
    slideX.setValue(-SCREEN_WIDTH);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setStep((s) => s - 1);
  };

  const handleNumberNext = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val < 0) { showAlert("Invalid", "Please enter a valid number."); return; }
    if (step === 3 && (val < 13 || val > 120)) { showAlert("Invalid", "Age must be between 13 and 120."); return; }
    const key = step === 1 ? "income" : step === 2 ? "savings" : "age";
    advance({ ...answers, [key]: step === 3 ? Math.round(val) : val }, step + 1);
  };

  const handleCurrencySelect = (code: string) => { advance({ ...answers, currency: code }, 1); };
  const handleGoalSelect = (goal: FinancialGoal) => { advance({ ...answers, goal }, 5); };
  const handleRiskSelect = (risk: RiskTolerance) => { advance({ ...answers, risk }, 6); };

  const handleCategoriesDone = () => {
    if (selectedCategories.length === 0) { showAlert("Select at least one", "Pick at least one spending category."); return; }
    advance({ ...answers, categories: selectedCategories }, 7);
  };

  const handleComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const a = answers as Answers;
      const updated = await userApi.updateProfile({
        profile: {
          monthlyIncome: a.income,
          age: a.age,
          primaryGoal: a.goal,
          riskTolerance: a.risk,
          spendingCategories: a.categories,
          monthlySavingsTarget: a.savings,
        },
        userPrefs: { currency: a.currency },
        hasCompletedOnboarding: true,
      } as any);
      setUser(updated);
      // AppNavigator re-renders automatically when hasCompletedOnboarding becomes true
    } catch {
      showAlert("Error", "Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Question renderer ─────────────────────────────────────────────────────

  const renderQuestion = () => {
    switch (step) {
      case 0:
        return (
          <QuestionCard
            question="What currency do you use?"
            sub="This personalises all amounts across the app."
            themedColors={themedColors}
          >
            <TouchableOpacity
              style={[styles.currencyBtn, { backgroundColor: themedColors.surface, borderColor: colors.primary }]}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={[styles.currencyBtnSymbol, { color: colors.primary }]}>
                {answers.currency ? getCurrencySymbol(answers.currency) : "¤"}
              </Text>
              <Text style={[styles.currencyBtnText, { color: themedColors.textPrimary }]}>
                {answers.currency ?? "Choose currency"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={themedColors.textSecondary} />
            </TouchableOpacity>
          </QuestionCard>
        );

      case 1:
        return (
          <QuestionCard
            question="What's your monthly income?"
            sub={`After tax, in ${answers.currency ?? "your currency"}.`}
            themedColors={themedColors}
          >
            <AmountInput symbol={symbol} value={inputValue} onChange={setInputValue} onSubmit={handleNumberNext} themedColors={themedColors} />
            <NextBtn onPress={handleNumberNext} />
          </QuestionCard>
        );

      case 2:
        return (
          <QuestionCard
            question="How much do you want to save each month?"
            sub="The rest becomes your daily spending budget."
            themedColors={themedColors}
          >
            <AmountInput symbol={symbol} value={inputValue} onChange={setInputValue} onSubmit={handleNumberNext} themedColors={themedColors} />
            <NextBtn onPress={handleNumberNext} />
          </QuestionCard>
        );

      case 3:
        return (
          <QuestionCard
            question="How old are you?"
            sub="Helps us tailor advice to your life stage."
            themedColors={themedColors}
          >
            <AmountInput symbol="" value={inputValue} onChange={setInputValue} onSubmit={handleNumberNext} themedColors={themedColors} placeholder="Your age" />
            <NextBtn onPress={handleNumberNext} />
          </QuestionCard>
        );

      case 4:
        return (
          <QuestionCard
            question="What's your main financial goal?"
            sub="Tap to select — we'll build a plan around it."
            themedColors={themedColors}
          >
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.goalCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}
                  onPress={() => handleGoalSelect(opt.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.goalIcon, { backgroundColor: opt.color + "20" }]}>
                    <Ionicons name={opt.icon} size={26} color={opt.color} />
                  </View>
                  <Text style={[styles.goalLabel, { color: themedColors.textPrimary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </QuestionCard>
        );

      case 5:
        return (
          <QuestionCard
            question="How do you feel about financial risk?"
            sub="There's no wrong answer — be honest."
            themedColors={themedColors}
          >
            <View style={styles.riskList}>
              {RISK_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.riskCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}
                  onPress={() => handleRiskSelect(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.riskEmoji}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.riskLabel, { color: themedColors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.riskDesc, { color: themedColors.textSecondary }]}>{opt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </QuestionCard>
        );

      case 6:
        return (
          <QuestionCard
            question="Which categories do you spend on?"
            sub="Select all that apply."
            themedColors={themedColors}
          >
            <View style={styles.catWrap}>
              {CATEGORY_OPTIONS.map((cat) => {
                const sel = selectedCategories.includes(cat.label);
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.catChip,
                      { borderColor: themedColors.border, backgroundColor: themedColors.surface },
                      sel && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedCategories((prev) =>
                      prev.includes(cat.label) ? prev.filter((c) => c !== cat.label) : [...prev, cat.label]
                    )}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, { color: sel ? "#fff" : themedColors.textPrimary }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <NextBtn onPress={handleCategoriesDone} label="Done" />
          </QuestionCard>
        );

      default:
        return null;
    }
  };

  // ── Analysis result card ──────────────────────────────────────────────────

  const renderAnalysis = () => {
    const a = answers as Answers;
    const sym = getCurrencySymbol(a.currency);
    const projData = generateProjectionData(a.savings);
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyBudget = Math.round(Math.max(0, a.income - a.savings) / daysInMonth);
    const timeline = getGoalTimelineLabel(a.goal, a.income, a.savings);
    const annualSavings = a.savings * 12;
    const coachMsg = `You can save ${sym}${annualSavings.toLocaleString()} this year toward your ${GOAL_NAMES[a.goal]} goal. ${timeline.startsWith("~") ? `At this rate you'll reach it in ${timeline} — let's make it happen!` : "Your coach will map the exact path — let's get started!"}`;

    return (
      <ScrollView contentContainerStyle={[styles.analysisScroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.analysisTitle, { color: themedColors.textPrimary }]}>Your Financial Snapshot 📊</Text>
        <Text style={[styles.analysisSub, { color: themedColors.textSecondary }]}>Based on your answers</Text>

        <View style={[styles.chartCard, { backgroundColor: themedColors.surface }]}>
          <Text style={[styles.chartTitle, { color: themedColors.textPrimary }]}>12-Month Savings Projection</Text>
          <LineChart
            data={{ labels: MONTH_LABELS, datasets: [{ data: projData }] }}
            width={SCREEN_WIDTH - 80}
            height={150}
            chartConfig={{
              backgroundGradientFrom: themedColors.surface,
              backgroundGradientTo: themedColors.surface,
              decimalPlaces: 0,
              color: () => colors.primary,
              labelColor: () => themedColors.textSecondary,
              propsForDots: { r: "3", strokeWidth: "2", stroke: colors.primary },
            }}
            bezier
            style={{ borderRadius: 12, marginTop: 8 }}
          />
        </View>

        <View style={styles.statRow}>
          {[
            { emoji: "💰", label: "Daily Budget", value: `${sym}${dailyBudget}` },
            { emoji: "🎯", label: "Goal Timeline", value: timeline },
            { emoji: "📊", label: "Risk Profile", value: a.risk.charAt(0).toUpperCase() + a.risk.slice(1) },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: themedColors.surface }]}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.coachCard, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}>
          <View style={[styles.coachAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <Text style={[styles.coachMsg, { color: themedColors.textPrimary }]}>{coachMsg}</Text>
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={handleComplete} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Let's Start 🚀</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: themedColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Status bar safe area */}
      <View style={{ height: insets.top, backgroundColor: themedColors.background }} />

      {/* Header — only during questions */}
      {step < 7 && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} disabled={step === 0}>
            <Ionicons name="chevron-back" size={24} color={step === 0 ? "transparent" : themedColors.textPrimary} />
          </TouchableOpacity>
          <ProgressBar step={step} themedColors={themedColors} />
          <Text style={[styles.stepCount, { color: themedColors.textSecondary }]}>
            {step + 1}/{TOTAL_STEPS}
          </Text>
        </View>
      )}

      {/* Question card (animated slide) */}
      {step < 7 && (
        <Animated.View style={[styles.cardArea, { transform: [{ translateX: slideX }] }]}>
          {renderQuestion()}
        </Animated.View>
      )}

      {/* Analysing screen */}
      {step === 7 && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={[styles.analyzingTitle, { color: themedColors.textPrimary }]}>
            Analysing your profile...
          </Text>
          <View style={styles.analyzeSteps}>
            {ANALYSIS_STEPS.map((s, i) => (
              <View key={i} style={styles.analyzeRow}>
                {i < analysisStep
                  ? <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  : i === analysisStep
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <View style={[styles.analyzeCircle, { borderColor: themedColors.border }]} />
                }
                <Text style={[styles.analyzeText, { color: i < analysisStep ? colors.success : themedColors.textSecondary }]}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Analysis results */}
      {step === 8 && (
        <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideX }] }]}>
          {renderAnalysis()}
        </Animated.View>
      )}

      {/* Bottom safe area (only during questions — analysis card handles its own) */}
      {step < 7 && <View style={{ height: insets.bottom }} />}

      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={answers.currency ?? "USD"}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  stepCount: { fontSize: 12, fontFamily: "RobotoMono-Regular", minWidth: 36, textAlign: "right" },
  cardArea: { flex: 1 },

  // Question layout
  questionCard: { flex: 1, paddingHorizontal: 24 },
  questionText: { paddingTop: 32, paddingBottom: 40 },
  question: { fontSize: 26, fontWeight: "700", fontFamily: "RobotoMono-Bold", lineHeight: 34, marginBottom: 10 },
  questionSub: { fontSize: 14, fontFamily: "RobotoMono-Regular", lineHeight: 20 },
  inputArea: { gap: 12 },

  // Currency button
  currencyBtn: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18, gap: 12 },
  currencyBtnSymbol: { fontSize: 24, fontWeight: "700", width: 32, textAlign: "center" },
  currencyBtnText: { flex: 1, fontSize: 16, fontFamily: "RobotoMono-Bold" },

  // Amount input
  amountRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingBottom: 8 },
  amountSymbol: { fontSize: 36, fontWeight: "700", fontFamily: "RobotoMono-Bold", marginBottom: 6 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: "700", fontFamily: "RobotoMono-Bold", borderBottomWidth: 2, paddingBottom: 6 },

  // Next button
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 30, paddingVertical: 16, marginTop: 12 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "RobotoMono-Bold" },

  // Goal grid
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalCard: { width: (SCREEN_WIDTH - 48 - 12) / 2, borderRadius: 16, borderWidth: 1.5, padding: 20, alignItems: "center", gap: 12 },
  goalIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 13, fontWeight: "700", fontFamily: "RobotoMono-Bold", textAlign: "center" },

  // Risk list
  riskList: { gap: 12 },
  riskCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 14 },
  riskEmoji: { fontSize: 28 },
  riskLabel: { fontSize: 15, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  riskDesc: { fontSize: 12, fontFamily: "RobotoMono-Regular", marginTop: 2 },

  // Categories
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  catChip: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 30, paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: "600", fontFamily: "RobotoMono-Bold" },

  // Analysing
  analyzingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  analyzingTitle: { fontSize: 22, fontWeight: "700", fontFamily: "RobotoMono-Bold", marginBottom: 32, textAlign: "center" },
  analyzeSteps: { gap: 16, width: "100%" },
  analyzeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  analyzeCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  analyzeText: { fontSize: 14, fontFamily: "RobotoMono-Regular" },

  // Analysis result
  analysisScroll: { padding: 24 },
  analysisTitle: { fontSize: 22, fontWeight: "700", fontFamily: "RobotoMono-Bold", marginBottom: 4 },
  analysisSub: { fontSize: 13, fontFamily: "RobotoMono-Regular", marginBottom: 20 },
  chartCard: { borderRadius: 20, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 9, textTransform: "uppercase", fontFamily: "RobotoMono-Regular", textAlign: "center" },
  statValue: { fontSize: 13, fontWeight: "700", fontFamily: "RobotoMono-Bold", textAlign: "center" },
  coachCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 20 },
  coachAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  coachMsg: { flex: 1, fontSize: 13, lineHeight: 20, fontFamily: "RobotoMono-Regular" },
  startBtn: { borderRadius: 30, paddingVertical: 16, alignItems: "center" },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
});

export default OnboardingScreen;
