import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, useThemedColors } from "../../theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showToggle?: boolean;
}

export const Input = ({
  label,
  error,
  containerStyle,
  style,
  showToggle,
  secureTextEntry,
  ...props
}: InputProps) => {
  const themedColors = useThemedColors();
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const isSecure = showToggle ? isHidden : secureTextEntry;

  return (
    <View style={containerStyle}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themedColors.surface,
              borderColor: themedColors.border,
              color: themedColors.textPrimary,
              paddingRight: showToggle ? 48 : spacing.md,
            },
            isFocused && {
              borderColor: colors.primary,
              backgroundColor: themedColors.background,
            },
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={themedColors.textSecondary}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {showToggle && (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsHidden((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isHidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={themedColors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    fontFamily: "RobotoMono-Regular",
    borderWidth: 2,
    height: 56,
  },
  inputError: {
    borderColor: colors.error,
  },
  toggleBtn: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
