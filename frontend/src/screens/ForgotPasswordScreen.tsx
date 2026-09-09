import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const themedColors = useThemedColors();
  const { showAlert } = useAlertStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    if (!email) {
      return;
    }

    setLoading(true);

    // Simulate sending email
    setTimeout(() => {
      setLoading(false);
      showAlert(
        "Email Sent",
        "If an account exists with this email, you will receive a password reset link.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={colors.textPrimaryLight}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <Input
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              style={styles.resetButton}
            />
          </View>

          <Text style={styles.footerText}>
            Remember your password?{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("Login")}
            >
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  titleContainer: {
    marginBottom: spacing["2xl"],
  },
  title: {
    fontFamily: "RobotoMono-Bold",
    fontSize: 32,
    color: colors.textPrimaryLight,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 13,
    color: colors.textSecondaryLight,
    lineHeight: 20,
  },
  form: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: "RobotoMono-Medium",
    fontSize: 14,
    color: colors.textPrimaryLight,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  resetButton: {
    marginBottom: spacing.lg,
  },
  footerText: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 13,
    color: colors.textSecondaryLight,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: spacing.xl,
  },
  linkText: {
    fontFamily: "RobotoMono-Bold",
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;
