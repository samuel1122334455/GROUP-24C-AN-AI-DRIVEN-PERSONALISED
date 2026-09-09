import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { colors, spacing, textStyles, useThemedColors } from "../../theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled,
  style,
  textStyle: customTextStyle,
  ...props
}: ButtonProps) => {
  const themedColors = useThemedColors();

  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return [
          styles.primaryButton,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ];
      case "secondary":
        return [
          styles.secondaryButton,
          {
            backgroundColor: themedColors.surface,
            shadowColor: themedColors.isDark ? "#000" : "#666",
          },
        ];
      case "outline":
        return [styles.outlineButton, { borderColor: themedColors.border }];
      case "ghost":
        return styles.ghostButton;
      default:
        return [
          styles.primaryButton,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "primary":
        return [styles.primaryText, { color: "#FFFFFF" }];
      case "secondary":
        return [styles.secondaryText, { color: colors.primary }];
      case "outline":
        return [styles.outlineText, { color: themedColors.textPrimary }];
      case "ghost":
        return [styles.ghostText, { color: colors.primary }];
      default:
        return [styles.primaryText, { color: "#FFFFFF" }];
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getButtonStyle(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primary
              : "#FFFFFF"
          }
        />
      ) : (
        <Text
          style={[styles.baseText, getTextStyle(), customTextStyle]}
          allowFontScaling={false}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  baseText: {
    fontSize: 16,
    fontFamily: "RobotoMono-Bold",
    textAlign: "center",
    fontWeight: "700",
  },
  primaryButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    fontFamily: "RobotoMono-Bold",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryText: {
    fontFamily: "RobotoMono-Bold",
    fontSize: 16,
    fontWeight: "700",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  outlineText: {
    fontFamily: "RobotoMono-Bold",
    fontSize: 16,
    fontWeight: "700",
  },
  ghostButton: {
    backgroundColor: "transparent",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  ghostText: {
    fontSize: 14,
    fontFamily: "RobotoMono-Bold",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
