import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, useThemedColors } from "../../theme";

interface BackButtonProps extends TouchableOpacityProps {
  color?: string;
}

export const BackButton = ({ color, style, ...props }: BackButtonProps) => {
  const themedColors = useThemedColors();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: themedColors.surface }, style]}
      activeOpacity={0.8}
      {...props}
    >
      <Ionicons
        name="chevron-back"
        size={24}
        color={color || themedColors.textPrimary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
});
