/**
 * Log Transaction Screen
 * Form to add a new transaction
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  useThemedColors,
} from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useTransactionStore } from "../stores/transactionStore";
import { useUserStore } from "../stores/userStore";
import { getCurrencySymbol } from "../utils/currency";
import { Button } from "../components/common/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LogTransactionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const themedColors = useThemedColors();
  const { addTransaction } = useTransactionStore();
  const { showAlert } = useAlertStore();
  const { user } = useUserStore();
  const prefill = route.params?.prefill;
  const currencySymbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");

  const [amount, setAmount] = useState(prefill?.amount?.toString() ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [category, setCategory] = useState("Food");
  const [mood, setMood] = useState("neutral");
  const [trigger, setTrigger] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAmountBlur = () => {
    const num = parseFloat(amount);
    if (!isNaN(num)) setAmount(num.toFixed(2));
  };

  const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];
  const moods = ["happy", "neutral", "stressed", "bored", "anxious"];
  const triggers = ["necessity", "habit", "stress", "peer_pressure", "celebration"];

  const handleSave = async () => {
      if (!amount || !description) {
          showAlert("Missing Info", "Please enter amount and description");
          return;
      }
      
      setLoading(true);
      try {
          await addTransaction({
              amount: parseFloat(amount),
              description,
              category,
              mood,
              trigger: trigger || undefined,
              date: new Date().toISOString()
          });
          navigation.goBack();
      } catch (error: any) {
          showAlert("Error", error.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={themedColors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>Log Spend</Text>
            <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {/* Amount Input */}
            <View style={styles.amountContainer}>
                <View style={styles.amountRow}>
                    <Text style={[styles.currencySymbol, { color: themedColors.textSecondary }]}>
                        {currencySymbol}
                    </Text>
                    <TextInput
                        style={[styles.amountInput, { color: themedColors.textPrimary }]}
                        placeholder="0.00"
                        placeholderTextColor={themedColors.textSecondary}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                        onBlur={handleAmountBlur}
                        autoFocus
                        textAlign="center"
                    />
                </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themedColors.textSecondary }]}>Description</Text>
                <TextInput
                    style={[styles.textInput, { 
                        backgroundColor: themedColors.surface,
                        color: themedColors.textPrimary 
                    }]}
                    placeholder="What did you buy?"
                    placeholderTextColor={themedColors.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themedColors.textSecondary }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {categories.map(c => (
                        <TouchableOpacity
                            key={c}
                            style={[
                                styles.chip,
                                category === c && { backgroundColor: colors.primary, borderColor: colors.primary },
                                { borderColor: themedColors.border }
                            ]}
                            onPress={() => setCategory(c)}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: category === c ? '#fff' : themedColors.textSecondary }
                            ]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Mood */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themedColors.textSecondary }]}>How did you feel?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {moods.map(m => (
                        <TouchableOpacity
                            key={m}
                            style={[
                                styles.chip,
                                mood === m && { backgroundColor: colors.accent, borderColor: colors.accent },
                                { borderColor: themedColors.border }
                            ]}
                            onPress={() => setMood(m)}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: mood === m ? '#fff' : themedColors.textSecondary }
                            ]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Trigger (Optional) */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themedColors.textSecondary }]}>Trigger (Optional)</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {triggers.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.chip,
                                trigger === t && { backgroundColor: colors.error, borderColor: colors.error },
                                { borderColor: themedColors.border }
                            ]}
                            onPress={() => setTrigger(trigger === t ? "" : t)}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: trigger === t ? '#fff' : themedColors.textSecondary }
                            ]}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

        </ScrollView>

        <View style={[styles.footer, { backgroundColor: themedColors.surface }]}>
            <Button
                title="Save Transaction"
                onPress={handleSave}
                loading={loading}
                variant="primary"
            />
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
  },
  closeButton: {
      padding: 4,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: '700',
  },
  content: {
      padding: spacing.lg,
  },
  amountContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
  },
  amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
  },
  currencySymbol: {
      fontSize: 28,
      fontWeight: '300',
      marginRight: 4,
      lineHeight: 64,
  },
  amountInput: {
      fontSize: 56,
      fontWeight: '700',
      width: SCREEN_WIDTH * 0.55,
      textAlign: 'center',
      fontFamily: typography.fontFamily.display,
  },
  inputGroup: {
      marginBottom: spacing.lg,
  },
  label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
  },
  textInput: {
      padding: 16,
      borderRadius: radius.xl,
      fontSize: 16,
  },
  chipsScroll: {
      flexDirection: 'row',
  },
  chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.full,
      borderWidth: 1,
      marginRight: 8,
  },
  chipText: {
      fontSize: 14,
      fontWeight: '500',
  },
  footer: {
      padding: spacing.lg,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      ...shadows.lg,
  }
});

export default LogTransactionScreen;
