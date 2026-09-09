import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { useAlertStore, AlertButton } from "../../stores/alertStore";
import { useThemeStore } from "../../stores/themeStore";

const { width } = Dimensions.get("window");

export const AppAlertModal = () => {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const { isDark } = useThemeStore();

  const surface = isDark ? "#1E1E1E" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#1f2937";
  const textSecondary = isDark ? "#a3b2a4" : "#6b7280";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";

  const hasDestructive = buttons.some((b) => b.style === "destructive");
  const iconName: keyof typeof Ionicons.glyphMap = hasDestructive
    ? "alert-circle"
    : "information-circle";
  const iconColor = hasDestructive ? colors.error : colors.primary;

  const handlePress = (btn: AlertButton) => {
    hideAlert();
    btn.onPress?.();
  };

  const cancelBtn = buttons.find((b) => b.style === "cancel");
  const actionBtns = buttons.filter((b) => b.style !== "cancel");

  const renderButton = (btn: AlertButton, index: number) => {
    const isDestructive = btn.style === "destructive";
    const isCancel = btn.style === "cancel";
    const flex = buttons.length > 1 ? 1 : undefined;
    const width = buttons.length === 1 ? "100%" : undefined;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(btn)}
        activeOpacity={0.8}
        style={[
          styles.button,
          { flex, width } as any,
          isDestructive && styles.destructiveButton,
          isCancel && [styles.cancelButton, { borderColor }],
          !isDestructive && !isCancel && styles.primaryButton,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            isDestructive && styles.destructiveText,
            isCancel && { color: textSecondary },
            !isDestructive && !isCancel && styles.primaryText,
          ]}
          allowFontScaling={false}
        >
          {btn.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideAlert}
    >
      <Pressable style={styles.overlay} onPress={cancelBtn ? hideAlert : undefined}>
        <Pressable style={[styles.card, { backgroundColor: surface }]} onPress={() => {}}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconColor + "1A" }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textPrimary }]} allowFontScaling={false}>
            {title}
          </Text>

          {/* Message */}
          {!!message && (
            <Text style={[styles.message, { color: textSecondary }]} allowFontScaling={false}>
              {message}
            </Text>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {cancelBtn && renderButton(cancelBtn, -1)}
            {cancelBtn && actionBtns.length > 0 && <View style={styles.buttonGap} />}
            {actionBtns.map((btn, i) => renderButton(btn, i))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: width - 56,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "RobotoMono-Bold",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "RobotoMono-Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    width: "100%",
    marginTop: 20,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
  },
  buttonGap: {
    width: 10,
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "RobotoMono-Bold",
    fontWeight: "700",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  destructiveText: {
    color: "#FFFFFF",
  },
});
