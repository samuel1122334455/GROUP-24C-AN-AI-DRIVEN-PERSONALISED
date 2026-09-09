import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, useThemedColors } from "../theme";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { SocialButton } from "../components/common/SocialButton";
import { Ionicons } from "@expo/vector-icons";
import * as authApi from "../api/auth";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const themedColors = useThemedColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setTokens } = useAuthStore();
  const { setUser } = useUserStore();
  const { showAlert } = useAlertStore();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Missing info", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      setUser(user);
      await setTokens(accessToken, refreshToken);
    } catch (error: any) {
      showAlert("Login failed", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={themedColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: themedColors.textPrimary }]}>Log in</Text>
            <Text style={[styles.subtitle, { color: themedColors.textSecondary }]}>
              By logging in, you agree to our{" "}
              <Text style={[styles.link, { color: themedColors.textPrimary }]}>Terms of Use</Text>.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: themedColors.textPrimary }]}>Email</Text>
            <Input
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              containerStyle={styles.inputContainer}
            />
            <Text style={[styles.label, { color: themedColors.textPrimary }]}>Password</Text>
            <Input
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
              containerStyle={styles.inputContainer}
            />
            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <Button title="Log in" onPress={handleLogin} loading={loading} variant="primary" style={styles.loginButton} />

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: themedColors.border }]} />
              <Text style={[styles.dividerText, { color: themedColors.textSecondary }]}>Or</Text>
              <View style={[styles.dividerLine, { backgroundColor: themedColors.border }]} />
            </View>

            <SocialButton icon="logo-google" title="Sign in with Google" iconColor="#DB4437" style={styles.socialButton} />
            <SocialButton icon="logo-facebook" title="Sign in with Facebook" iconColor="#4267B2" style={styles.socialButton} />
          </View>

          <Text style={[styles.footerText, { color: themedColors.textSecondary }]}>
            For more information, please see our{" "}
            <Text style={[styles.link, { color: themedColors.textPrimary }]}>Privacy policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  titleContainer: { marginBottom: spacing["2xl"] },
  title: { fontFamily: "RobotoMono-Bold", fontSize: 32, marginBottom: spacing.sm },
  subtitle: { fontFamily: "RobotoMono-Regular", fontSize: 13, lineHeight: 20 },
  link: { fontFamily: "RobotoMono-Bold" },
  form: { marginBottom: spacing.xl },
  label: { fontFamily: "RobotoMono-Medium", fontSize: 14, marginBottom: spacing.sm },
  inputContainer: { marginBottom: spacing.md },
  forgotPassword: { alignSelf: "flex-end", marginBottom: spacing.lg },
  forgotPasswordText: { fontFamily: "RobotoMono-Medium", fontSize: 12 },
  loginButton: { marginBottom: spacing.xl },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: "RobotoMono-Regular", marginHorizontal: spacing.md, fontSize: 12 },
  socialButton: { marginBottom: spacing.md },
  footerText: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: spacing.xl,
    lineHeight: 18,
  },
});

export default LoginScreen;
