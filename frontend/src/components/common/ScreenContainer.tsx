import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, useThemedColors } from "../../theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  withKeyboardAvoidingView?: boolean;
  edges?: Array<"top" | "right" | "bottom" | "left">;
}

export const ScreenContainer = ({
  children,
  style,
  backgroundColor,
  withKeyboardAvoidingView = true,
  edges = Platform.OS === "android"
    ? ["top", "left", "right", "bottom"]
    : ["top", "left", "right"],
}: ScreenContainerProps) => {
  const themedColors = useThemedColors();
  const bgColor = backgroundColor || themedColors.background;
  const Content = <View style={[styles.content, style]}>{children}</View>;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={edges}
    >
      <StatusBar
        barStyle={
          backgroundColor === colors.primary || themedColors.isDark
            ? "light-content"
            : "dark-content"
        }
      />
      {withKeyboardAvoidingView ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          {Content}
        </KeyboardAvoidingView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
