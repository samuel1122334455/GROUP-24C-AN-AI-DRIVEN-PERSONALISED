/**
 * Transaction Detail Screen
 * Shows details of a specific transaction
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAlertStore } from "../stores/alertStore";
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

const TransactionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const themedColors = useThemedColors();
  const { transactionId } = route.params as { transactionId: string };
  const { transactions, deleteTransaction } = useTransactionStore();
  const { showAlert } = useAlertStore();
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
      const t = transactions.find(t => t._id === transactionId);
      if (t) setTransaction(t);
  }, [transactionId, transactions]);

    const handleDelete = async () => {
        showAlert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTransaction(transactionId);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (!transaction) return (
        <ScreenContainer backgroundColor={themedColors.background}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: themedColors.textSecondary }}>Loading...</Text>
            </View>
        </ScreenContainer>
    );

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>Details</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.mainCard, { backgroundColor: themedColors.surface }]}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}1A` }]}>
                    <Ionicons name="wallet" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.amount, { color: themedColors.textPrimary }]}>
                    -${transaction.amount.toFixed(2)}
                </Text>
                <Text style={[styles.description, { color: themedColors.textSecondary }]}>
                    {transaction.description}
                </Text>
                <Text style={[styles.date, { color: themedColors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleString()}
                </Text>
            </View>

            <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>Analysis</Text>
                
                <View style={[styles.detailRow, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
                    <Text style={[styles.label, { color: themedColors.textSecondary }]}>Category</Text>
                    <Text style={[styles.value, { color: themedColors.textPrimary }]}>{transaction.category}</Text>
                </View>

                {transaction.mood && (
                    <View style={[styles.detailRow, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
                        <Text style={[styles.label, { color: themedColors.textSecondary }]}>Mood</Text>
                        <Text style={[styles.value, { color: themedColors.textPrimary }]}>{transaction.mood}</Text>
                    </View>
                )}

                {transaction.trigger && (
                    <View style={[styles.detailRow, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
                        <Text style={[styles.label, { color: themedColors.textSecondary }]}>Trigger</Text>
                        <Text style={[styles.value, { color: colors.warning }]}>{transaction.trigger}</Text>
                    </View>
                )}
                
                 {transaction.notes && (
                    <View style={[styles.notesCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
                        <Text style={[styles.label, { color: themedColors.textSecondary, marginBottom: 4 }]}>Notes</Text>
                        <Text style={[styles.notesText, { color: themedColors.textPrimary }]}>{transaction.notes}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
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
  backButton: {
      padding: 8,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: '700',
  },
  deleteButton: {
      padding: 8,
  },
  content: {
      padding: spacing.md,
  },
  mainCard: {
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: radius["2xl"],
      marginBottom: spacing.xl,
  },
  iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
  },
  amount: {
      fontSize: 32,
      fontWeight: '800',
      marginBottom: 4,
  },
  description: {
      fontSize: 18,
      fontWeight: '500',
      marginBottom: 4,
  },
  date: {
      fontSize: 14,
  },
  detailsSection: {
      gap: spacing.md,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: spacing.xs,
  },
  detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: radius.xl,
      borderWidth: 1,
  },
  label: {
      fontSize: 14,
      fontWeight: '500',
  },
  value: {
      fontSize: 16,
      fontWeight: '700',
  },
  notesCard: {
      padding: 16,
      borderRadius: radius.xl,
      borderWidth: 1,
  },
  notesText: {
      fontSize: 16,
      lineHeight: 24,
  }
});

export default TransactionDetailScreen;
