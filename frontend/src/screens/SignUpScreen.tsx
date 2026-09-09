import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAlertStore } from "../stores/alertStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { colors, spacing, useThemedColors, typography } from "../theme";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { SocialButton } from "../components/common/SocialButton";
import { Ionicons } from "@expo/vector-icons";
import * as authApi from "../api/auth";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "SignUp">;

const SignUpScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const themedColors = useThemedColors();
  const { showAlert } = useAlertStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setTokens } = useAuthStore();
  const { setUser } = useUserStore();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      showAlert("Missing info", "Please enter your name, email, and password.");
      return;
    }

    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authApi.register({
        name,
        email,
        password,
      });
      setUser(user);
      await setTokens(accessToken, refreshToken);
      // AppNavigator routes to OnboardingScreen since hasCompletedOnboarding is false
    } catch (error: any) {
      showAlert("Sign up failed", error?.message || "Please try again.");
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
            <Text style={[styles.title, { color: themedColors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: themedColors.textSecondary }]}>
              Start your journey to financial freedom.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
              containerStyle={styles.inputContainer}
            />

            <Text style={[styles.infoText, { color: themedColors.textSecondary }]}>
              By signing up, you agree to our{" "}
              <Text style={[styles.link, { color: themedColors.textPrimary }]}>Terms of Use</Text>{" "}
              and{" "}
              <Text style={[styles.link, { color: themedColors.textPrimary }]}>Privacy Policy</Text>.
            </Text>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              variant="primary"
              style={styles.signupButton}
            />

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: themedColors.border }]} />
              <Text style={[styles.dividerText, { color: themedColors.textSecondary }]}>Or</Text>
              <View style={[styles.dividerLine, { backgroundColor: themedColors.border }]} />
            </View>

            <View style={styles.socialRow}>
              <SocialButton icon="logo-google" iconColor="#DB4437" style={styles.socialIconButton} />
              <SocialButton icon="logo-facebook" iconColor="#4267B2" style={styles.socialIconButton} />
              <SocialButton icon="logo-apple" iconColor="#000" style={styles.socialIconButton} />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themedColors.textSecondary }]}>
              Already have an account?{" "}
              <Text style={styles.linkText} onPress={() => navigation.navigate("Login")}>
                Log in
              </Text>
            </Text>
          </View>
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
  title: { fontSize: 32, fontWeight: "700", marginBottom: spacing.sm, fontFamily: typography.fontFamily.display },
  subtitle: { fontSize: 13, lineHeight: 20, fontFamily: typography.fontFamily.body },
  link: { fontWeight: "700" },
  form: { marginBottom: spacing.xl },
  inputContainer: { marginBottom: spacing.md },
  infoText: { fontSize: 12, marginBottom: spacing.lg, lineHeight: 18, fontFamily: typography.fontFamily.body },
  signupButton: { marginBottom: spacing.xl },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: spacing.md, fontSize: 12, fontFamily: typography.fontFamily.body },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: spacing.md, marginBottom: spacing.xl },
  socialIconButton: { width: 60, height: 60, borderRadius: 30, paddingHorizontal: 0 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingBottom: spacing.xl, marginTop: spacing.lg },
  footerText: { fontSize: 13, textAlign: "center", fontFamily: typography.fontFamily.body },
  linkText: { fontWeight: "700", fontSize: 13, color: colors.primary, textDecorationLine: "underline", fontFamily: typography.fontFamily.body },
});

export default SignUpScreen;
