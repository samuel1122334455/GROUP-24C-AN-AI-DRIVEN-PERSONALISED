import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, textStyles, useThemedColors } from "../../theme";

interface SocialButtonProps extends TouchableOpacityProps {
  icon: keyof typeof Ionicons.glyphMap;
  title?: string;
  iconColor?: string;
  style?: ViewStyle;
}

export const SocialButton = ({
  icon,
  title,
  iconColor,
  style,
  ...props
}: SocialButtonProps) => {
  const themedColors = useThemedColors();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: themedColors.surface,
          borderColor: themedColors.border,
        },
        !title && styles.iconOnly,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      <Ionicons
        name={icon}
        size={24}
        color={iconColor || themedColors.textPrimary}
      />
      {title && (
        <Text style={[styles.text, { color: themedColors.textPrimary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
  },
  iconOnly: {
    width: 50,
    height: 50,
    paddingHorizontal: 0,
    borderRadius: 25,
  },
  text: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontFamily: "RobotoMono-SemiBold",
  },
});
