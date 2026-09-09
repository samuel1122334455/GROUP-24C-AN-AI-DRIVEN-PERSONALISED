/**
 * Scan Receipt Screen
 * Take/pick a photo → AI extracts details → user reviews & confirms → logged
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { TypingIndicator } from "../components/common/TypingIndicator";
import { Button } from "../components/common/Button";
import { useAlertStore } from "../stores/alertStore";
import { useTransactionStore } from "../stores/transactionStore";
import { useUserStore } from "../stores/userStore";
import { getCurrencySymbol } from "../utils/currency";
import * as transactionsApi from "../api/transactions";
import { colors, spacing, typography, radius, shadows, useThemedColors } from "../theme";

type Stage = "capture" | "processing" | "review";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ScanReceiptScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlertStore();
  const { addTransaction } = useTransactionStore();
  const { user } = useUserStore();
  const currencySymbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");

  const [stage, setStage] = useState<Stage>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);

  // Editable review fields
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [notes, setNotes] = useState("");

  const pickImage = async (fromCamera: boolean) => {
    let permission;
    if (fromCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      showAlert(
        "Permission required",
        fromCamera
          ? "Allow camera access to take a photo of your receipt."
          : "Allow photo library access to pick a receipt image."
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"] as ImagePicker.MediaType[],
          base64: true,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"] as ImagePicker.MediaType[],
          base64: true,
          quality: 0.8,
        });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      showAlert("Error", "Could not read image data. Please try again.");
      return;
    }

    setImageUri(asset.uri);
    setStage("processing");
    await analyzeReceipt(asset.base64, asset.mimeType ?? "image/jpeg");
  };

  const analyzeReceipt = async (base64: string, mimeType: string) => {
    try {
      const parsed = await transactionsApi.parseReceipt(base64, mimeType);
      setDescription(parsed.description);
      setAmount(parsed.amount.toFixed(2));
      setCategory(parsed.category);
      setNotes(parsed.notes);
      setStage("review");
    } catch (err: any) {
      setStage("capture");
      setImageUri(null);
      showAlert(
        "Could not read receipt",
        err?.message || "Please try a clearer photo with good lighting, or log manually."
      );
    }
  };

  const handleConfirm = async () => {
    const numericAmount = parseFloat(amount);
    if (!description.trim()) {
      showAlert("Missing info", "Please enter a description.");
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showAlert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    setLogging(true);
    try {
      await addTransaction({
        description: description.trim(),
        amount: numericAmount,
        category,
        notes: notes.trim() || undefined,
        mood: "neutral",
        date: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (err: any) {
      showAlert("Error", err?.message || "Failed to log transaction.");
    } finally {
      setLogging(false);
    }
  };

  const reset = () => {
    setStage("capture");
    setImageUri(null);
    setDescription("");
    setAmount("");
    setCategory("Other");
    setNotes("");
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity
          onPress={() => (stage === "review" ? reset() : navigation.goBack())}
          style={styles.headerBtn}
        >
          <Ionicons
            name={stage === "review" ? "arrow-back" : "close"}
            size={24}
            color={themedColors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
          {stage === "capture" ? "Scan Receipt" : stage === "processing" ? "Analyzing…" : "Review Receipt"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── STAGE 1: Capture ──────────────────────────────── */}
      {stage === "capture" && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero card */}
          <View style={[styles.heroCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
            <View style={[styles.heroIconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: themedColors.textPrimary }]}>
              AI Receipt Scanner
            </Text>
            <Text style={[styles.heroSubtitle, { color: themedColors.textSecondary }]}>
              Take a photo of any receipt or bill. The AI will automatically extract the
              merchant, amount, and category — then you confirm before it's logged.
            </Text>
          </View>

          {/* Camera button */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.primary }]}
            onPress={() => pickImage(true)}
            activeOpacity={0.85}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle} numberOfLines={1}>Take a Photo</Text>
              <Text style={styles.actionSub} numberOfLines={1}>Best for fresh receipts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Gallery button */}
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: themedColors.surface, borderColor: themedColors.border, borderWidth: 1 }]}
            onPress={() => pickImage(false)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="images" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>Choose from Gallery</Text>
              <Text style={[styles.actionSub, { color: themedColors.textSecondary }]} numberOfLines={1}>Use an existing photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themedColors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.tip, { color: themedColors.textSecondary }]}>
            💡 Tip: Good lighting and a flat, crease-free receipt give the best results.
          </Text>
        </ScrollView>
      )}

      {/* ── STAGE 2: Processing ───────────────────────────── */}
      {stage === "processing" && (
        <View style={styles.processingWrap}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={[styles.previewImage, { borderColor: themedColors.border }]}
              resizeMode="cover"
            />
          )}
          <View style={[styles.processingCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
            <View style={[styles.aiAvatar, { backgroundColor: colors.surfaceDarkLight }]}>
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.processingTextWrap}>
              <Text style={[styles.processingTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
                Reading your receipt…
              </Text>
              <TypingIndicator color={colors.primary} size={8} />
            </View>
          </View>
        </View>
      )}

      {/* ── STAGE 3: Review ───────────────────────────────── */}
      {stage === "review" && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Success banner */}
          <View style={[styles.successBanner, { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}40` }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ flexShrink: 0 }} />
            <Text style={[styles.successText, { color: colors.success, flex: 1 }]} numberOfLines={1}>
              Analyzed! Review and confirm.
            </Text>
          </View>

          {/* Image thumbnail */}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={[styles.thumbnail, { borderColor: themedColors.border }]} resizeMode="cover" />
          )}

          {/* Extracted data card */}
          <View style={[styles.reviewCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themedColors.textSecondary }]} numberOfLines={1}>AMOUNT</Text>
              <View style={[styles.amountRow, { borderColor: themedColors.border, backgroundColor: themedColors.background }]}>
                <Text style={[styles.currencySymbol, { color: themedColors.textSecondary }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: themedColors.textPrimary }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themedColors.border }]} />

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themedColors.textSecondary }]} numberOfLines={1}>MERCHANT</Text>
              <TextInput
                style={[styles.fieldInput, { color: themedColors.textPrimary, borderColor: themedColors.border, backgroundColor: themedColors.background }]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Starbucks"
                placeholderTextColor={themedColors.textSecondary}
                maxLength={50}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: themedColors.border }]} />

            {/* Category */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themedColors.textSecondary }]} numberOfLines={1}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      { borderColor: themedColors.border },
                      category === c && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, { color: category === c ? "#fff" : themedColors.textSecondary }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Notes — only show if AI extracted something */}
            {(notes.length > 0) && (
              <>
                <View style={[styles.divider, { backgroundColor: themedColors.border }]} />
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: themedColors.textSecondary }]} numberOfLines={1}>NOTES</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.notesInput, { color: themedColors.textPrimary, borderColor: themedColors.border, backgroundColor: themedColors.background }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Optional notes"
                    placeholderTextColor={themedColors.textSecondary}
                    multiline
                  />
                </View>
              </>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.retakeBtn, { borderColor: themedColors.border }]} onPress={reset}>
              <Ionicons name="camera-outline" size={18} color={themedColors.textPrimary} />
              <Text style={[styles.retakeBtnText, { color: themedColors.textPrimary }]} numberOfLines={1}>Retake</Text>
            </TouchableOpacity>
            <View style={styles.confirmBtnWrap}>
              <Button title="Log Transaction" onPress={handleConfirm} loading={logging} variant="primary" />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", fontFamily: typography.fontFamily.display },

  content: { padding: spacing.lg, gap: spacing.md },

  // Capture stage
  heroCard: {
    borderRadius: radius["2xl"], borderWidth: 1, padding: spacing.xl,
    alignItems: "center", gap: spacing.md, ...shadows.sm,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { fontSize: 20, fontWeight: "700", fontFamily: typography.fontFamily.display },
  heroSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21, fontFamily: typography.fontFamily.body },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.md, borderRadius: radius["2xl"], ...shadows.sm,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  actionText: { flex: 1, flexShrink: 1, overflow: "hidden" },
  actionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: typography.fontFamily.display },
  actionSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2, fontFamily: typography.fontFamily.body },
  tip: { fontSize: 13, textAlign: "center", lineHeight: 20, fontFamily: typography.fontFamily.body },

  // Processing stage
  processingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
  previewImage: {
    width: SCREEN_WIDTH - spacing.xl * 2, height: 220,
    borderRadius: radius["2xl"], borderWidth: 1,
  },
  processingCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.lg, borderRadius: radius["2xl"], borderWidth: 1,
    width: "100%", ...shadows.sm,
  },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  processingTextWrap: { flex: 1, flexShrink: 1 },
  processingTitle: { fontSize: 15, fontWeight: "600", fontFamily: typography.fontFamily.body, marginBottom: 4 },

  // Review stage
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: spacing.md, borderRadius: radius.xl, borderWidth: 1,
  },
  successText: { fontSize: 14, fontWeight: "600", fontFamily: typography.fontFamily.body },
  thumbnail: {
    width: "100%", height: 160, borderRadius: radius["2xl"], borderWidth: 1,
  },
  reviewCard: {
    borderRadius: radius["2xl"], borderWidth: 1, overflow: "hidden", ...shadows.sm,
  },
  field: { padding: spacing.md, gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, fontFamily: typography.fontFamily.display },
  amountRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: spacing.md,
  },
  currencySymbol: { fontSize: 22, fontWeight: "300", marginRight: 4 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: "700", paddingVertical: 8, fontFamily: typography.fontFamily.display },
  fieldInput: {
    borderWidth: 1, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 16, fontFamily: typography.fontFamily.body,
  },
  notesInput: { minHeight: 72, textAlignVertical: "top" },
  divider: { height: 1, marginHorizontal: spacing.md },
  chipsScroll: { flexDirection: "row" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600", fontFamily: typography.fontFamily.body },
  actions: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  retakeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderRadius: 30, borderWidth: 1,
  },
  retakeBtnText: { fontSize: 15, fontWeight: "600", fontFamily: typography.fontFamily.display },
  confirmBtnWrap: { flex: 1 },
});

export default ScanReceiptScreen;
