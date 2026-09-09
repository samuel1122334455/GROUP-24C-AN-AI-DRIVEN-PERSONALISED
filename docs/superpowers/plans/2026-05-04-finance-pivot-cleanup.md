# Finance Pivot Cleanup & Feature Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all diet/nutrition references, fix broken registration and dashboard features, and ship a multi-conversation AI chat system with image input.

**Architecture:** Three sequential phases — Phase 1 cleans the codebase foundation (critical: registration is broken), Phase 2 wires up broken features, Phase 3 adds new screens. Backend is Express + MongoDB (TypeScript). Frontend is Expo SDK 54 managed workflow + React Navigation 6 + Zustand.

**Tech Stack:** Node.js/Express/TypeScript, MongoDB/Mongoose, React Native/Expo SDK 54, React Navigation 6, Zustand, Google Gemini (primary AI), OpenAI (secondary AI), expo-image-picker, date-fns.

---

## File Map

### Phase 1 — Cleanup
| Action | File |
|--------|------|
| Modify | `backend/src/controllers/auth.controller.ts` |
| Modify | `backend/src/scripts/seed.ts` |
| Modify | `backend/src/server.ts` |
| Modify | `backend/src/services/ai/gemini.service.ts` |
| Modify | `backend/src/services/ai/openai.service.ts` |
| Modify | `backend/src/controllers/transaction.controller.ts` |
| Modify | `backend/src/controllers/user.controller.ts` |
| Modify | `frontend/app.json` |
| Delete | `frontend/src/screens/AuthScreen.tsx` |
| Modify | `frontend/src/screens/LoginScreen.tsx` |
| Modify | `frontend/src/screens/SignUpScreen.tsx` |
| Modify | `frontend/src/types/chat.ts` |
| Rewrite | `ARCHITECTURE.md` |

### Phase 2 — Bug Fixes
| Action | File |
|--------|------|
| Modify | `frontend/src/screens/DashboardScreen.tsx` |
| Create | `frontend/src/screens/AllTransactionsScreen.tsx` |
| Modify | `frontend/src/navigation/types.ts` |
| Modify | `frontend/src/navigation/AppNavigator.tsx` |
| Modify | `frontend/src/screens/ProfileScreen.tsx` |

### Phase 3 — New Features
| Action | File |
|--------|------|
| Modify | `frontend/src/navigation/types.ts` |
| Create | `frontend/src/screens/ScanReceiptScreen.tsx` |
| Modify | `frontend/src/screens/LogTransactionScreen.tsx` |
| Modify | `backend/src/models/Chat.model.ts` |
| Modify | `backend/src/services/ai/provider.interface.ts` |
| Modify | `backend/src/services/ai/gemini.service.ts` |
| Modify | `backend/src/services/ai/openai.service.ts` |
| Modify | `backend/src/services/ai/aiService.ts` |
| Modify | `backend/src/controllers/chat.controller.ts` |
| Modify | `backend/src/routes/chat.routes.ts` |
| Modify | `frontend/src/types/chat.ts` |
| Modify | `frontend/src/api/chat.ts` |
| Create | `frontend/src/screens/ChatHistoryScreen.tsx` |
| Create | `frontend/src/screens/ChatInterfaceScreen.tsx` |
| Modify | `frontend/src/navigation/AppNavigator.tsx` |

---

## PHASE 1 — CLEANUP

---

### Task 1: Fix broken registration (critical)

`auth.controller.ts` builds user profile using diet fields (height, weight, BMR) that no longer exist in the User model schema. New registrations silently fail or create invalid data. This task replaces the diet logic with the correct financial profile fields.

**Files:**
- Modify: `backend/src/controllers/auth.controller.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { User } from "../models/User.model";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateTokenPair, verifyRefreshToken, JWTPayload } from "../utils/jwt.util";
import { AppError, catchAsync } from "../middleware/error.middleware";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, profile } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email already registered", 409);

  const normalizedProfile = {
    age: profile?.age ?? 25,
    monthlyIncome: profile?.monthlyIncome ?? 0,
    primaryGoal: profile?.primaryGoal ?? "budget_control",
    riskTolerance: profile?.riskTolerance ?? "moderate",
    spendingCategories: profile?.spendingCategories ?? [],
  };

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    profile: normalizedProfile,
  });

  const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  user.refreshTokens = [refreshToken];
  await user.save();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user: user.toJSON(), accessToken, refreshToken },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

  const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: user.toJSON(), accessToken, refreshToken },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token required", 400);

  let payload: JWTPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError("Invalid refresh token", 401);
  }

  const newPayload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(newPayload);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const userId = (req as any).user?.userId;

  if (userId && refreshToken) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
      await user.save();
    }
  }

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default { register, login, refreshToken, logout };
```

- [ ] **Step 2: Verify the backend compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/auth.controller.ts
git commit -m "fix: replace diet registration with financial profile fields"
```

---

### Task 2: Remove stale comments and fix server banner

Eight small text changes across five files.

**Files:**
- Modify: `backend/src/server.ts`
- Modify: `backend/src/services/ai/gemini.service.ts`
- Modify: `backend/src/services/ai/openai.service.ts`
- Modify: `backend/src/controllers/transaction.controller.ts`
- Modify: `backend/src/controllers/user.controller.ts`

- [ ] **Step 1: Fix server.ts — banner and endpoint list**

In `backend/src/server.ts`, replace lines 26–42 (the `console.log` block inside the listen callback) with:

```typescript
      console.log("");
      console.log("=".repeat(60));
      console.log("🚀 AI Finance Coach Backend Server");
      console.log("=".repeat(60));
      console.log(`📍 Server running on: http://localhost:${config.port}`);
      console.log(`📱 Network access: http://192.168.1.224:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🤖 AI Provider: ${config.ai.provider.toUpperCase()}`);
      console.log(`📅 Started at: ${new Date().toLocaleString()}`);
      console.log("=".repeat(60));
      console.log("");
      console.log("Available endpoints:");
      console.log(`  Health:       http://localhost:${config.port}/health`);
      console.log(`  Auth:         http://localhost:${config.port}/api/auth`);
      console.log(`  User:         http://localhost:${config.port}/api/user`);
      console.log(`  Chat:         http://localhost:${config.port}/api/chat`);
      console.log(`  Transactions: http://localhost:${config.port}/api/transactions`);
      console.log("");
      console.log("Press Ctrl+C to stop the server");
      console.log("=".repeat(60));
```

- [ ] **Step 2: Fix gemini.service.ts JSDoc**

In `backend/src/services/ai/gemini.service.ts` line 64, change:
```typescript
  /**
   * Get system prompt for nutrition expert
   */
```
to:
```typescript
  /**
   * Get system prompt for financial coach
   */
```

- [ ] **Step 3: Fix openai.service.ts comments**

In `backend/src/services/ai/openai.service.ts`:

Line 31 — change:
```typescript
      // Add system message with nutrition expert context
```
to:
```typescript
      // Add system message with financial coach context
```

Line 66 — change:
```typescript
  /**
   * Get system prompt for nutrition expert
   */
```
to:
```typescript
  /**
   * Get system prompt for financial coach
   */
```

- [ ] **Step 4: Remove stale comment from transaction.controller.ts**

Delete lines 103–104 in `backend/src/controllers/transaction.controller.ts`:
```typescript
// Removed getMealSuggestions as it's not directly applicable. 
// Future: Implement getFinancialTips or similar if needed.
```

- [ ] **Step 5: Remove stale comments from user.controller.ts**

In `backend/src/controllers/user.controller.ts`:

Line 9 — change:
```typescript
import { Transaction } from "../models/Transaction.model"; // Changed MealLog to Transaction
```
to:
```typescript
import { Transaction } from "../models/Transaction.model";
```

Line 142 — change:
```typescript
    await Transaction.deleteMany({ userId }); // Changed MealLog to Transaction
```
to:
```typescript
    await Transaction.deleteMany({ userId });
```

- [ ] **Step 6: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/server.ts backend/src/services/ai/gemini.service.ts backend/src/services/ai/openai.service.ts backend/src/controllers/transaction.controller.ts backend/src/controllers/user.controller.ts
git commit -m "chore: remove diet references from backend comments and server banner"
```

---

### Task 3: Fix the database seed script

The seed script creates a test user with a diet profile that will fail Mongoose validation against the current User model.

**Files:**
- Modify: `backend/src/scripts/seed.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// backend/src/scripts/seed.ts
import mongoose from "mongoose";
import { User } from "../models/User.model";
import { hashPassword } from "../utils/password.util";
import { config } from "../config/environment";

const seedUser = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✓ Connected to MongoDB");

    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("✓ Test user already exists");
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await hashPassword("password123");

    await User.create({
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      profile: {
        age: 30,
        monthlyIncome: 4000,
        primaryGoal: "budget_control",
        riskTolerance: "moderate",
        spendingCategories: [],
      },
    });

    console.log("✓ Test user created successfully");
    console.log("\n📧 Email: test@example.com");
    console.log("🔑 Password: password123\n");

    await mongoose.connection.close();
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    process.exit(1);
  }
};

seedUser();
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/scripts/seed.ts
git commit -m "fix: update seed script to use financial user profile"
```

---

### Task 4: Update app.json and delete dead AuthScreen

`app.json` still references the diet app name, green brand colour, and old bundle IDs. `AuthScreen.tsx` is a dead placeholder not referenced anywhere in the navigator.

**Files:**
- Modify: `frontend/app.json`
- Delete: `frontend/src/screens/AuthScreen.tsx`

- [ ] **Step 1: Replace frontend/app.json**

```json
{
  "expo": {
    "name": "AI Finance Coach",
    "slug": "ai-finance-coach",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2D9CDB"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.aifinancecoach.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2D9CDB"
      },
      "package": "com.aifinancecoach.app",
      "permissions": ["CAMERA"],
      "softwareKeyboardLayoutMode": "pan"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-secure-store", "expo-image-picker"],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "sdkVersion": "54.0.0"
  }
}
```

- [ ] **Step 2: Delete AuthScreen.tsx**

```bash
rm "frontend/src/screens/AuthScreen.tsx"
```

- [ ] **Step 3: Install expo-image-picker**

```bash
cd frontend && npx expo install expo-image-picker
```

Expected: package added to package.json. Version will be ~16.0.x for SDK 54.

- [ ] **Step 4: Commit**

```bash
git add frontend/app.json frontend/package.json frontend/package-lock.json
git rm frontend/src/screens/AuthScreen.tsx
git commit -m "chore: update app.json to finance branding, add expo-image-picker"
```

---

### Task 5: Fix LoginScreen theming and label

`LoginScreen` hardcodes light-theme colours (`colors.textPrimaryLight`, `colors.textSecondaryLight`) so it renders incorrectly in dark mode. The submit button label says "Connect" instead of "Log in".

**Files:**
- Modify: `frontend/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Replace the file content**

```typescript
// frontend/src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      setUser(user);
      await setTokens(accessToken, refreshToken);
    } catch (error: any) {
      Alert.alert("Login failed", error?.message || "Please try again.");
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/screens/LoginScreen.tsx
git commit -m "fix: apply themedColors to LoginScreen, rename button to Log in"
```

---

### Task 6: Fix SignUpScreen and clean up chat types

`SignUpScreen` sends `currency: "USD"` which the User model doesn't have. `chat.ts` types contain diet-themed metadata and `defaultQuickReplies` referencing meals and macros.

**Files:**
- Modify: `frontend/src/screens/SignUpScreen.tsx`
- Modify: `frontend/src/types/chat.ts`

- [ ] **Step 1: Fix SignUpScreen — remove currency, add age input**

The profile object sent to `authApi.register` currently is:
```typescript
profile: {
    monthlyIncome: income ? parseFloat(income) : 0,
    primaryGoal: goal,
    riskTolerance: risk,
    currency: "USD",      // ← remove this
    spendingCategories: []
},
```

Add an `age` state variable and a numeric input. Replace the relevant portion of `SignUpScreen.tsx`:

```typescript
// Add age state alongside existing state variables (after line 35):
const [age, setAge] = useState("");

// In the form JSX, add an age input directly above the Monthly Income input:
<Input
  placeholder="Your Age"
  value={age}
  onChangeText={setAge}
  keyboardType="numeric"
  containerStyle={styles.inputContainer}
/>
<Input
  placeholder="Monthly Income (approx)"
  value={income}
  onChangeText={setIncome}
  keyboardType="numeric"
  containerStyle={styles.inputContainer}
/>

// Update the profile object in handleSignUp:
profile: {
    age: age ? parseInt(age, 10) : undefined,
    monthlyIncome: income ? parseFloat(income) : 0,
    primaryGoal: goal,
    riskTolerance: risk,
    spendingCategories: [],
},
```

- [ ] **Step 2: Replace frontend/src/types/chat.ts**

```typescript
// frontend/src/types/chat.ts

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  error?: boolean;
  errorMessage?: string;
}

export interface ChatConversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  updatedAt: Date;
  lastMessage: {
    content: string;
    role: "user" | "assistant";
  } | null;
}

export interface SendMessageData {
  content: string;
  conversationId: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/screens/SignUpScreen.tsx frontend/src/types/chat.ts
git commit -m "fix: remove currency from signup, add age input, clean chat types"
```

---

### Task 7: Rewrite ARCHITECTURE.md

The document still describes the diet app with Meal, MealLog collections, calorie flows, and diet-specific data models.

**Files:**
- Rewrite: `ARCHITECTURE.md`

- [ ] **Step 1: Replace the file**

```markdown
# AI Finance Coach — Architecture Documentation

## System Overview

AI Finance Coach is a mobile app that acts as a compassionate behavioral finance coach. It helps users understand the emotional and psychological reasons behind their spending, tracks daily transactions with mood/trigger metadata, and provides personalized AI guidance through a multi-conversation chat interface.

---

## Tech Stack

### Frontend: React Native (Expo SDK 54)
- Managed workflow — no custom native code needed
- React Navigation 6 (native stack + bottom tabs)
- Zustand for state management
- Axios with JWT interceptors for API calls

### Backend: Node.js + Express + TypeScript
- REST API with JWT auth (access token 15 min, refresh token 7 days)
- MongoDB + Mongoose for data persistence
- Winston for structured logging
- Helmet, CORS, express-rate-limit for security

### AI: Provider Abstraction Layer
- Supports Google Gemini and OpenAI via a common `IAIProvider` interface
- Switch providers with a single env var change (`AI_PROVIDER=gemini|openai`)
- Gemini supports multimodal (text + image); OpenAI vision also supported

---

## Data Models

### User
```
{
  email: String (unique, required),
  password: String (bcrypt hashed, never returned),
  name: String,
  profile: {
    age: Number,
    monthlyIncome: Number,
    riskTolerance: "conservative" | "moderate" | "aggressive",
    primaryGoal: "save_emergency" | "pay_debt" | "invest" | "budget_control",
    spendingCategories: [String],
  },
  refreshTokens: [String],
  timestamps: true
}
```

### Transaction
```
{
  userId: ObjectId → User,
  description: String,
  amount: Number,
  category: String,
  mood: "stressed" | "happy" | "neutral" | "bored" | "anxious" | "excited" | "sad",
  trigger: "peer_pressure" | "stress" | "celebration" | "habit" | "boredom" | "necessity",
  notes: String (optional),
  date: Date,
  timestamps: true
}
```
Indexes: `{ userId, date }` desc, `category`, `mood`.

### Chat
```
{
  userId: ObjectId → User,
  title: String (auto-set from first user message, max 50 chars),
  messages: [{
    role: "user" | "assistant",
    content: String,
    timestamp: Date,
    metadata: { error?: Boolean, errorMessage?: String }
  }],
  timestamps: true
}
```
Multiple Chat documents allowed per user (one per conversation).

---

## API Endpoints

```
POST   /api/auth/register        Create account
POST   /api/auth/login           Login
POST   /api/auth/refresh         Refresh access token
POST   /api/auth/logout          Invalidate refresh token

GET    /api/user/profile         Get own profile
PUT    /api/user/profile         Update profile fields
GET    /api/user/spending-summary  Daily spending totals, budget, emotional count
DELETE /api/user/account         Delete account + all data

GET    /api/transactions         List transactions (optional ?date= filter)
POST   /api/transactions         Log a transaction
GET    /api/transactions/:id     Get single transaction
DELETE /api/transactions/:id     Delete transaction

GET    /api/chat/conversations           List all conversations (sorted by recent)
POST   /api/chat/conversations           Create new empty conversation
POST   /api/chat/message                 Send message (requires conversationId in body)
GET    /api/chat/conversation/:id        Get full conversation with messages
DELETE /api/chat/conversation/:id        Delete a conversation
```

---

## Auth Flow

```
User logs in
  → POST /api/auth/login
  → Server returns accessToken (15 min) + refreshToken (7 days)
  → accessToken stored in Zustand (memory)
  → refreshToken stored in expo-secure-store (encrypted)
  → Axios interceptor attaches accessToken to every request
  → On 401: interceptor calls /api/auth/refresh, retries original request
  → On refresh failure: clearTokens() → user sees login screen
```

---

## Spending Summary Flow

```
DashboardScreen mounts
  → fetchTransactions() + getSpendingSummary() called in parallel
  → Backend aggregates today's transactions for the user
  → Returns: totalSpent, budgetLimit (monthlyIncome/30), emotionalSpendingCount, topTrigger
  → Dashboard renders progress ring + stats
  → Pull-to-refresh repeats both calls
```

---

## Chat Flow (Multi-Conversation)

```
User opens Coach tab
  → ChatHistoryScreen loads conversation list (GET /api/chat/conversations)
  → Taps conversation or "New Chat"
  → ChatInterfaceScreen opens (full-screen stack, no tab bar)
  → Loads message history (GET /api/chat/conversation/:id)
  → User types message (+ optional image from gallery)
  → POST /api/chat/message with { content, conversationId, imageBase64?, imageMimeType? }
  → Backend appends user message, sets title from first message if needed
  → Calls AI provider (Gemini/OpenAI) with conversation history + optional image
  → AI response appended + saved
  → Frontend displays response with markdown rendering
```

---

## AI Provider Abstraction

```
services/ai/
├── provider.interface.ts    IAIProvider interface
├── gemini.service.ts        Google Gemini implementation (supports multimodal)
├── openai.service.ts        OpenAI implementation (supports vision)
└── aiService.ts             Singleton router + formatUserContext()
```

Switch provider: set `AI_PROVIDER=gemini` or `AI_PROVIDER=openai` in `.env`.

---

## Frontend Screen Map

```
Auth flow:   Landing → Login / SignUp / ForgotPassword
Main tabs:   Dashboard | ChatHistory (Coach) | Profile | Settings
Modals:      LogTransaction, ScanReceipt
Stack:       TransactionDetail, AllTransactions, ChatInterface
```

---

## Security

- Passwords: bcrypt (10 rounds)
- JWT: short-lived access tokens, refresh token rotation, max 5 stored per user
- API: Helmet headers, CORS allowlist, rate limit 100 req/15 min
- Secrets: never committed; `.env` in `.gitignore`
- Images sent to AI: passed as base64 in request body, never stored in MongoDB
```

- [ ] **Step 2: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs: rewrite ARCHITECTURE.md for finance app"
```

---

## PHASE 2 — BUG FIXES

---

### Task 8: Wire dashboard spending summary

The dashboard always shows `$0 spent of $100 limit` because `getSpendingSummary()` was commented out. `userApi` and the backend endpoint already exist — just needs to be called.

**Files:**
- Modify: `frontend/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Add the import and wire the call**

At the top of `DashboardScreen.tsx`, add the userApi import after the existing store imports:

```typescript
import * as userApi from "../api/user";
```

Replace the existing `useEffect` (around line 115):

```typescript
  useEffect(() => {
    const load = async () => {
      fetchTransactions();
      try {
        const summary = await userApi.getSpendingSummary();
        useUserStore.getState().setSpendingSummary(summary);
      } catch {
        // silent — summary stays null, dashboard shows defaults
      }
    };
    load();
  }, []);
```

Replace the `onRefresh` callback:

```typescript
  const onRefresh = React.useCallback(async () => {
    fetchTransactions();
    try {
      const summary = await userApi.getSpendingSummary();
      useUserStore.getState().setSpendingSummary(summary);
    } catch {
      // silent
    }
  }, []);
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/screens/DashboardScreen.tsx
git commit -m "fix: wire getSpendingSummary on dashboard mount and refresh"
```

---

### Task 9: Build AllTransactionsScreen and fix "See All"

The "See All" button navigates to `TransactionDetailScreen` with `transactionId: "all"` which hangs forever. This task creates the correct screen and wires the button.

**Files:**
- Create: `frontend/src/screens/AllTransactionsScreen.tsx`
- Modify: `frontend/src/navigation/types.ts`
- Modify: `frontend/src/navigation/AppNavigator.tsx`
- Modify: `frontend/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Add AllTransactions to navigation types**

In `frontend/src/navigation/types.ts`, update `RootStackParamList`:

```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TransactionDetail: { transactionId: string };
  LogTransaction: { prefill?: { description?: string; amount?: number } } | undefined;
  AllTransactions: undefined;
  ScanReceipt: undefined;
  ChatInterface: { conversationId: string };
};
```

Also update `MainTabParamList` — replace `AIChat` with `ChatHistory`:

```typescript
export type MainTabParamList = {
  Dashboard: undefined;
  ChatHistory: undefined;
  Profile: undefined;
  Settings: undefined;
};
```

- [ ] **Step 2: Create AllTransactionsScreen.tsx**

```typescript
// frontend/src/screens/AllTransactionsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { colors, spacing, typography, radius, shadows, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { useTransactionStore } from "../stores/transactionStore";

const FILTERS = ["All", "Emotional", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category.toLowerCase()) {
    case "food": return "restaurant";
    case "transport": return "car";
    case "shopping": return "cart";
    case "bills": return "receipt";
    case "entertainment": return "game-controller";
    case "health": return "medical";
    default: return "card";
  }
};

const AllTransactionsScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchTransactions(); // no date param = all records
  }, []);

  const filtered = transactions.filter((t) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Emotional") return t.mood && t.mood !== "neutral";
    return t.category.toLowerCase() === activeFilter.toLowerCase();
  });

  // Group by date
  const grouped: { dateLabel: string; total: number; items: typeof transactions }[] = [];
  const seen: Record<string, number> = {};

  for (const t of filtered) {
    const dateLabel = format(new Date(t.date), "MMM d, yyyy");
    if (seen[dateLabel] === undefined) {
      seen[dateLabel] = grouped.length;
      grouped.push({ dateLabel, total: 0, items: [] });
    }
    const g = grouped[seen[dateLabel]];
    g.items.push(t);
    g.total += t.amount;
  }

  type ListItem =
    | { type: "header"; dateLabel: string; total: number }
    | { type: "row"; transaction: (typeof transactions)[0] };

  const listData: ListItem[] = grouped.flatMap((g) => [
    { type: "header" as const, dateLabel: g.dateLabel, total: g.total },
    ...g.items.map((t) => ({ type: "row" as const, transaction: t })),
  ]);

  return (
    <ScreenContainer backgroundColor={themedColors.background} withKeyboardAvoidingView={false}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>All Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: themedColors.border, backgroundColor: themedColors.surface },
              activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, { color: activeFilter === f ? "#fff" : themedColors.textSecondary }]}>
              {f}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === "header" ? `h-${item.dateLabel}` : `r-${item.transaction._id}-${i}`
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTransactions} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={themedColors.textSecondary} />
            <Text style={[styles.emptyText, { color: themedColors.textSecondary }]}>
              No transactions yet. Start logging your spending!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={[styles.dateHeader, { borderBottomColor: themedColors.border }]}>
                <Text style={[styles.dateLabel, { color: themedColors.textSecondary }]}>{item.dateLabel}</Text>
                <Text style={[styles.dateTotal, { color: themedColors.textPrimary }]}>
                  ${item.total.toFixed(2)}
                </Text>
              </View>
            );
          }
          const t = item.transaction;
          return (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}
              onPress={() => navigation.navigate("TransactionDetail", { transactionId: t._id })}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name={getCategoryIcon(t.category)} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
                  {t.description}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowCategory, { color: themedColors.textSecondary }]}>{t.category}</Text>
                  {t.mood && t.mood !== "neutral" && (
                    <View style={[styles.moodBadge, { backgroundColor: `${colors.warning}22` }]}>
                      <Text style={[styles.moodText, { color: colors.warning }]}>{t.mood}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.rowAmount, { color: themedColors.textPrimary }]}>
                -${t.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", fontFamily: typography.fontFamily.display },
  filterBar: { maxHeight: 52 },
  filterContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  dateHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  dateLabel: { fontSize: 13, fontWeight: "600" },
  dateTotal: { fontSize: 13, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    marginHorizontal: spacing.md, marginVertical: 4, padding: 14,
    borderRadius: radius["2xl"], borderWidth: 1, ...shadows.sm,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowCategory: { fontSize: 12 },
  moodBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  moodText: { fontSize: 11, fontWeight: "600" },
  rowAmount: { fontSize: 15, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 80 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl },
});

export default AllTransactionsScreen;
```

- [ ] **Step 3: Register AllTransactionsScreen in AppNavigator**

In `frontend/src/navigation/AppNavigator.tsx`, add the import:
```typescript
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
```

Inside the authenticated stack (alongside `TransactionDetail` and `LogTransaction`), add:
```tsx
<RootStack.Screen name="AllTransactions" component={AllTransactionsScreen} />
```

- [ ] **Step 4: Fix "See All" button in DashboardScreen**

In `frontend/src/screens/DashboardScreen.tsx`, find the "See All" TouchableOpacity press handler and change:
```typescript
onPress={() => navigation.navigate("TransactionDetail", { transactionId: "all" })}
```
to:
```typescript
onPress={() => navigation.navigate("AllTransactions")}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/screens/AllTransactionsScreen.tsx frontend/src/navigation/types.ts frontend/src/navigation/AppNavigator.tsx frontend/src/screens/DashboardScreen.tsx
git commit -m "feat: add AllTransactionsScreen, fix See All navigation"
```

---

### Task 10: Persist profile changes to backend

`ProfileScreen` updates Zustand state only — goal, risk tolerance, and spending category changes are lost on restart.

**Files:**
- Modify: `frontend/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add the API calls to each handler**

At the top of `ProfileScreen.tsx`, add the import:
```typescript
import * as userApi from "../api/user";
```

Replace the three handlers with API-backed versions. Find and replace the existing handlers:

```typescript
  const handleGoalChange = async (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    updateProfile({ primaryGoal: goal });
    try {
      await userApi.updateProfile({ profile: { primaryGoal: goal } });
    } catch {
      // revert on failure
      setSelectedGoal(user?.profile?.primaryGoal ?? "save_emergency");
      updateProfile({ primaryGoal: user?.profile?.primaryGoal ?? "save_emergency" });
      Alert.alert("Error", "Failed to save goal. Please try again.");
    }
  };

  const handleRiskChange = async (risk: RiskTolerance) => {
    setRiskTolerance(risk);
    updateProfile({ riskTolerance: risk });
    try {
      await userApi.updateProfile({ profile: { riskTolerance: risk } });
    } catch {
      setRiskTolerance(user?.profile?.riskTolerance ?? "moderate");
      updateProfile({ riskTolerance: user?.profile?.riskTolerance ?? "moderate" });
      Alert.alert("Error", "Failed to save risk tolerance. Please try again.");
    }
  };
```

For `toggleCategory`, add a debounce ref at the top of the component (after existing state):

```typescript
  const categoryDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleCategory = (cat: string) => {
    let newCats: string[];
    if (spendingCategories.includes(cat)) {
      newCats = spendingCategories.filter((c) => c !== cat);
    } else {
      newCats = [...spendingCategories, cat];
    }
    setSpendingCategories(newCats);
    updateProfile({ spendingCategories: newCats });

    if (categoryDebounce.current) clearTimeout(categoryDebounce.current);
    categoryDebounce.current = setTimeout(async () => {
      try {
        await userApi.updateProfile({ profile: { spendingCategories: newCats } });
      } catch {
        // revert
        const original = user?.profile?.spendingCategories ?? [];
        setSpendingCategories(original);
        updateProfile({ spendingCategories: original });
        Alert.alert("Error", "Failed to save categories. Please try again.");
      }
    }, 500);
  };
```

Add the `Alert` import to the imports at the top of the file:
```typescript
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/screens/ProfileScreen.tsx
git commit -m "fix: persist profile goal, risk, and category changes to backend"
```

---

## PHASE 3 — NEW FEATURES

---

### Task 11: ScanReceiptScreen and LogTransaction prefill

**Files:**
- Create: `frontend/src/screens/ScanReceiptScreen.tsx`
- Modify: `frontend/src/screens/LogTransactionScreen.tsx`
- Modify: `frontend/src/navigation/AppNavigator.tsx`

Note: `AllTransactions`, `ScanReceipt`, `ChatInterface`, and `LogTransaction` prefill were already added to `RootStackParamList` in Task 9 Step 1. The `MainTabParamList` `AIChat → ChatHistory` rename is included there too.

- [ ] **Step 1: Create ScanReceiptScreen.tsx**

```typescript
// frontend/src/screens/ScanReceiptScreen.tsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography, radius, shadows, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { Button } from "../components/common/Button";

const parseReceipt = (text: string): { description: string; amount: number | null } => {
  const amountMatch = text.match(/\$?([\d,]+\.?\d{0,2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", "")) : null;

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const merchantLine = lines.find((l) => !/^\$?[\d.,]+$/.test(l) && l.length > 2);
  const description = merchantLine ?? "Receipt Purchase";

  return { description, amount };
};

const ScanReceiptScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const [receiptText, setReceiptText] = useState("");

  const handleParse = () => {
    if (!receiptText.trim()) {
      Alert.alert("Empty", "Paste or type some receipt text first.");
      return;
    }
    const { description, amount } = parseReceipt(receiptText);
    navigation.replace("LogTransaction", {
      prefill: { description, amount: amount ?? undefined },
    });
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>Scan Receipt</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.receiptCard, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}>
          <Ionicons name="receipt-outline" size={40} color={colors.primary} style={styles.icon} />
          <Text style={[styles.cardTitle, { color: themedColors.textPrimary }]}>Paste Receipt Text</Text>
          <Text style={[styles.cardSubtitle, { color: themedColors.textSecondary }]}>
            Copy text from your receipt or banking app and paste it below. We'll extract the amount and merchant name.
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: themedColors.surfaceAlt ?? themedColors.background, color: themedColors.textPrimary, borderColor: themedColors.border }]}
            placeholder="e.g.&#10;Starbucks Coffee&#10;$6.75&#10;Thank you!"
            placeholderTextColor={themedColors.textSecondary}
            multiline
            numberOfLines={8}
            value={receiptText}
            onChangeText={setReceiptText}
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Parse Receipt"
          onPress={handleParse}
          variant="primary"
          style={styles.parseButton}
        />

        <Text style={[styles.hint, { color: themedColors.textSecondary }]}>
          Tip: Works best when the receipt has a merchant name and a dollar amount on separate lines.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  closeButton: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", fontFamily: typography.fontFamily.display },
  content: { padding: spacing.lg, gap: spacing.lg },
  receiptCard: {
    borderRadius: radius["2xl"], borderWidth: 1, padding: spacing.lg,
    alignItems: "center", gap: spacing.md, ...shadows.sm,
  },
  icon: { marginBottom: spacing.xs },
  cardTitle: { fontSize: 18, fontWeight: "700", fontFamily: typography.fontFamily.display },
  cardSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  textArea: {
    width: "100%", minHeight: 140, borderRadius: radius.xl, borderWidth: 1,
    padding: spacing.md, fontSize: 15, fontFamily: typography.fontFamily.body,
  },
  parseButton: { marginTop: spacing.sm },
  hint: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});

export default ScanReceiptScreen;
```

- [ ] **Step 2: Update LogTransactionScreen to accept prefill params**

At the top of `LogTransactionScreen.tsx`, add:
```typescript
import { useRoute } from "@react-navigation/native";
```

Inside the component, after the navigation declaration add:
```typescript
  const route = useRoute<any>();
  const prefill = route.params?.prefill;
```

Change the initial state values for `amount` and `description`:
```typescript
  const [amount, setAmount] = useState(prefill?.amount?.toString() ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
```

- [ ] **Step 3: Register ScanReceiptScreen in AppNavigator**

Add the import:
```typescript
import ScanReceiptScreen from "../screens/ScanReceiptScreen";
```

Inside the authenticated stack, add:
```tsx
<RootStack.Screen
  name="ScanReceipt"
  component={ScanReceiptScreen}
  options={{ presentation: "modal" }}
/>
```

- [ ] **Step 4: Wire the Scan Receipt button in DashboardScreen**

In `DashboardScreen.tsx`, find the `QuickAction` with `label="Scan Receipt"` and add an `onPress`:
```tsx
<QuickAction icon="scan" label="Scan Receipt" onPress={() => navigation.navigate("ScanReceipt")} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/screens/ScanReceiptScreen.tsx frontend/src/screens/LogTransactionScreen.tsx frontend/src/navigation/AppNavigator.tsx frontend/src/screens/DashboardScreen.tsx
git commit -m "feat: add ScanReceiptScreen with receipt parser and LogTransaction prefill"
```

---

### Task 12: Update Chat model and backend routes for multi-conversation

**Files:**
- Modify: `backend/src/models/Chat.model.ts`
- Modify: `backend/src/controllers/chat.controller.ts`
- Modify: `backend/src/routes/chat.routes.ts`

- [ ] **Step 1: Update Chat.model.ts — add title, allow multiple per user**

```typescript
// backend/src/models/Chat.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: { error?: boolean; errorMessage?: string };
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    error: { type: Boolean },
    errorMessage: { type: String },
  },
});

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Chat" },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

ChatSchema.index({ userId: 1, updatedAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
export default Chat;
```

- [ ] **Step 2: Rewrite chat.controller.ts**

```typescript
// backend/src/controllers/chat.controller.ts
import { Response } from "express";
import { Chat } from "../models/Chat.model";
import { User } from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError, catchAsync } from "../middleware/error.middleware";
import { aiService } from "../services/ai/aiService";
import { AIMessage } from "../services/ai/provider.interface";

export const listConversations = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const conversations = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();

  const summaries = conversations.map((conv) => ({
    _id: conv._id,
    title: conv.title,
    updatedAt: conv.updatedAt,
    lastMessage:
      conv.messages.length > 0
        ? {
            content: conv.messages[conv.messages.length - 1].content.substring(0, 80),
            role: conv.messages[conv.messages.length - 1].role,
          }
        : null,
  }));

  res.status(200).json({ success: true, data: summaries });
});

export const createConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const conversation = await Chat.create({ userId, title: "New Chat", messages: [] });

  res.status(201).json({
    success: true,
    data: { _id: conversation._id, title: conversation.title },
  });
});

export const sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401);

  const { content, conversationId, imageBase64, imageMimeType } = req.body;
  if (!conversationId) throw new AppError("conversationId is required", 400);

  const conversation = await Chat.findOne({ _id: conversationId, userId });
  if (!conversation) throw new AppError("Conversation not found", 404);

  conversation.messages.push({ role: "user", content, timestamp: new Date() });

  // Auto-title from first user message
  if (conversation.messages.filter((m) => m.role === "user").length === 1) {
    conversation.title = content.substring(0, 50).trim();
  }

  let userContext: string | undefined;
  const user = await User.findById(userId);
  if (user) userContext = aiService.formatUserContext(user);

  try {
    const recentMessages = conversation.messages.slice(-105);
    const aiMessages: AIMessage[] = recentMessages.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const aiResponse = await aiService.chat(aiMessages, userContext, imageBase64, imageMimeType);

    const assistantMessage = { role: "assistant" as const, content: aiResponse.content, timestamp: new Date() };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { message: assistantMessage, conversationId: conversation._id },
    });
  } catch (error: any) {
    const errorMessage = {
      role: "assistant" as const,
      content: "I apologize, but I encountered an error processing your request. Please try again.",
      timestamp: new Date(),
      metadata: { error: true, errorMessage: error.message },
    };
    conversation.messages.push(errorMessage);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { message: errorMessage, conversationId: conversation._id },
    });
  }
});

export const getConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;

  const conversation = conversationId
    ? await Chat.findOne({ _id: conversationId, userId })
    : null;

  if (!conversation) {
    res.status(200).json({
      success: true,
      data: { _id: null, userId, title: "New Chat", messages: [], createdAt: new Date(), updatedAt: new Date() },
    });
    return;
  }

  res.status(200).json({ success: true, data: conversation });
});

export const clearConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;

  await Chat.findOneAndDelete({ _id: conversationId, userId });

  res.status(200).json({ success: true, message: "Conversation deleted successfully" });
});

export default { listConversations, createConversation, sendMessage, getConversation, clearConversation };
```

- [ ] **Step 3: Update chat.routes.ts**

```typescript
// backend/src/routes/chat.routes.ts
import { Router } from "express";
import {
  listConversations,
  createConversation,
  sendMessage,
  getConversation,
  clearConversation,
} from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.post("/message", sendMessage);
router.get("/conversation/:conversationId", getConversation);
router.delete("/conversation/:conversationId", clearConversation);

export default router;
```

- [ ] **Step 4: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/Chat.model.ts backend/src/controllers/chat.controller.ts backend/src/routes/chat.routes.ts
git commit -m "feat: multi-conversation chat — model, controller, routes"
```

---

### Task 13: Add image support to AI provider layer

**Files:**
- Modify: `backend/src/services/ai/provider.interface.ts`
- Modify: `backend/src/services/ai/gemini.service.ts`
- Modify: `backend/src/services/ai/openai.service.ts`
- Modify: `backend/src/services/ai/aiService.ts`

- [ ] **Step 1: Update provider.interface.ts**

```typescript
// backend/src/services/ai/provider.interface.ts

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  finishReason: string;
  tokensUsed?: number;
}

export interface AIConfig {
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface IAIProvider {
  chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export default IAIProvider;
```

- [ ] **Step 2: Update gemini.service.ts — add multimodal support**

```typescript
// backend/src/services/ai/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, AIMessage, AIResponse, AIConfig } from "./provider.interface";

export class GeminiService implements IAIProvider {
  private client: GoogleGenerativeAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model });

      const systemPrompt = this.getSystemPrompt(userContext);
      const conversationHistory = messages
        .map((msg) => `${msg.role === "assistant" ? "model" : "user"}: ${msg.content}`)
        .join("\n\n");

      const fullPrompt = `${systemPrompt}\n\n=== Conversation ===\n${conversationHistory}`;

      type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
      const parts: Part[] = [{ text: fullPrompt }];

      if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      return {
        content: text || "I apologize, I could not generate a response.",
        finishReason: "stop",
        tokensUsed: undefined,
      };
    } catch (error: any) {
      console.error("Gemini API error:", error.message);
      throw new Error(`Gemini error: ${error.message}`);
    }
  }

  /**
   * Get system prompt for financial coach
   */
  private getSystemPrompt(userContext?: string): string {
    let prompt = `You are a compassionate financial behavioral coach specializing in spending psychology. Your role is to:

1. Analyze the EMOTIONAL and PSYCHOLOGICAL reasons behind spending
2. Use behavioral finance principles (loss aversion, present bias, mental accounting)
3. Provide actionable strategies to align spending with long-term goals
4. Be supportive and non-judgmental—money shame is counterproductive
5. Ask reflective questions to build self-awareness
6. Use financial icons (💰, 📈, 🧠, 🎯, etc.)
7. Focus on the "why" behind spending, not just the "what"

IMPORTANT SAFETY RULES:
- DO NOT provide specific investment recommendations (stocks, crypto, etc.)
- DO NOT give tax advice or legal counsel
- DO NOT diagnose financial trauma or mental health conditions
- DIRECT users to certified financial planners for complex investing
- DIRECT users to tax professionals for tax questions
- Provide general strategies for debt reduction and budgeting frameworks (50/30/20, etc.)

Mandatory Disclosures:
- If asked for investment advice: "I can help you understand general investing principles, but for specific recommendations, consult a certified financial advisor."
- If asked for tax advice: "Tax laws vary by location. Please consult a CPA or tax professional."`;

    if (userContext) prompt += `\n\nUSER PROFILE CONTEXT:\n${userContext}`;
    return prompt;
  }

  getProviderName(): string { return "Google Gemini"; }
  isConfigured(): boolean { return !!this.config.apiKey && !!this.config.model; }
}

export default GeminiService;
```

- [ ] **Step 3: Update openai.service.ts — add vision support**

```typescript
// backend/src/services/ai/openai.service.ts
import OpenAI from "openai";
import { IAIProvider, AIMessage, AIResponse, AIConfig } from "./provider.interface";

export class OpenAIService implements IAIProvider {
  private client: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      const systemMessage = { role: "system" as const, content: this.getSystemPrompt(userContext) };

      const formattedMessages = messages.map((msg, index) => {
        const isLastUserMessage = index === messages.length - 1 && msg.role === "user";
        if (isLastUserMessage && imageBase64 && imageMimeType) {
          return {
            role: msg.role as "user",
            content: [
              { type: "text" as const, text: msg.content },
              {
                type: "image_url" as const,
                image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
              },
            ],
          };
        }
        return { role: msg.role as "user" | "assistant", content: msg.content };
      });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [systemMessage, ...formattedMessages] as any,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000,
      });

      const completion = response.choices[0];
      return {
        content: completion.message.content || "I apologize, I could not generate a response.",
        finishReason: completion.finish_reason,
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("OpenAI API error:", error.message);
      throw new Error(`OpenAI error: ${error.message}`);
    }
  }

  /**
   * Get system prompt for financial coach
   */
  private getSystemPrompt(userContext?: string): string {
    let prompt = `You are a compassionate financial behavioral coach specializing in spending psychology. Your role is to:

1. Analyze the EMOTIONAL and PSYCHOLOGICAL reasons behind spending
2. Use behavioral finance principles (loss aversion, present bias, mental accounting)
3. Provide actionable strategies to align spending with long-term goals
4. Be supportive and non-judgmental—money shame is counterproductive
5. Ask reflective questions to build self-awareness
6. Use financial icons (💰, 📈, 🧠, 🎯, etc.)
7. Focus on the "why" behind spending, not just the "what"

IMPORTANT SAFETY RULES:
- DO NOT provide specific investment recommendations (stocks, crypto, etc.)
- DO NOT give tax advice or legal counsel
- DO NOT diagnose financial trauma or mental health conditions
- DIRECT users to certified financial planners for complex investing
- DIRECT users to tax professionals for tax questions

Mandatory Disclosures:
- If asked for investment advice: "I can help you understand general investing principles, but for specific recommendations, consult a certified financial advisor."
- If asked for tax advice: "Tax laws vary by location. Please consult a CPA or tax professional."`;

    if (userContext) prompt += `\n\nUSER PROFILE CONTEXT:\n${userContext}`;
    return prompt;
  }

  getProviderName(): string { return "OpenAI"; }
  isConfigured(): boolean { return !!this.config.apiKey && !!this.config.model; }
}

export default OpenAIService;
```

- [ ] **Step 4: Update aiService.ts — thread image params through**

In `backend/src/services/ai/aiService.ts`, update the `chat` method signature and pass-through:

```typescript
  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      if (!this.provider.isConfigured()) {
        throw new Error("AI provider is not properly configured");
      }
      return await this.provider.chat(messages, userContext, imageBase64, imageMimeType);
    } catch (error: any) {
      console.error("AI Service error:", error.message);
      return {
        content: `I apologize, but I'm having trouble processing your request right now. This could be due to:\n\n🔧 Technical issues with the AI service\n🔑 Configuration problems\n📡 Network connectivity\n\nPlease try again in a moment. If the problem persists, contact support.`,
        finishReason: "error",
      };
    }
  }
```

- [ ] **Step 5: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/ai/provider.interface.ts backend/src/services/ai/gemini.service.ts backend/src/services/ai/openai.service.ts backend/src/services/ai/aiService.ts
git commit -m "feat: add image input support to AI provider layer (Gemini multimodal, OpenAI vision)"
```

---

### Task 14: Update frontend chat API and types

**Files:**
- Modify: `frontend/src/api/chat.ts`

- [ ] **Step 1: Replace frontend/src/api/chat.ts**

```typescript
// frontend/src/api/chat.ts
import apiClient, { handleApiError } from "./client";
import {
  SendMessageData,
  SendMessageResponse,
  ChatConversation,
  ConversationSummary,
} from "../types/chat";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export const listConversations = async (): Promise<ConversationSummary[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ConversationSummary[]>>("/chat/conversations");
    return response.data.data ?? [];
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const createConversation = async (): Promise<{ _id: string; title: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ _id: string; title: string }>>("/chat/conversations");
    if (!response.data?.data) throw new Error("Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const sendMessage = async (data: SendMessageData): Promise<SendMessageResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<SendMessageResponse>>("/chat/message", data);
    if (!response.data?.data) throw new Error(response.data?.message || "Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getConversation = async (conversationId: string): Promise<ChatConversation> => {
  try {
    const response = await apiClient.get<ApiResponse<ChatConversation>>(
      `/chat/conversation/${conversationId}`
    );
    if (!response.data?.data) throw new Error(response.data?.message || "Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const clearConversation = async (conversationId: string): Promise<void> => {
  try {
    await apiClient.delete(`/chat/conversation/${conversationId}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export default { listConversations, createConversation, sendMessage, getConversation, clearConversation };
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/chat.ts
git commit -m "feat: update chat API client for multi-conversation and image support"
```

---

### Task 15: Build ChatHistoryScreen

**Files:**
- Create: `frontend/src/screens/ChatHistoryScreen.tsx`

- [ ] **Step 1: Create ChatHistoryScreen.tsx**

```typescript
// frontend/src/screens/ChatHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { formatDistanceToNow } from "date-fns";
import { colors, spacing, typography, radius, shadows, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import * as chatApi from "../api/chat";
import { ConversationSummary } from "../types/chat";

const ChatHistoryScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNewChat = async () => {
    try {
      const conv = await chatApi.createConversation();
      navigation.navigate("ChatInterface", { conversationId: conv._id });
    } catch {
      Alert.alert("Error", "Could not start a new chat. Please try again.");
    }
  };

  const handleOpen = (conv: ConversationSummary) => {
    navigation.navigate("ChatInterface", { conversationId: conv._id });
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background} withKeyboardAvoidingView={false}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>Coach</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewChat}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: themedColors.border }]} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={themedColors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: themedColors.textPrimary }]}>No conversations yet</Text>
              <Text style={[styles.emptySubtitle, { color: themedColors.textSecondary }]}>
                Tap + to start your first chat with your financial coach.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: themedColors.surface }]}
            onPress={() => handleOpen(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={[styles.rowTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowTime, { color: themedColors.textSecondary }]}>
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </Text>
              </View>
              {item.lastMessage && (
                <Text style={[styles.rowPreview, { color: themedColors.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage.role === "assistant" ? "🤖 " : "You: "}
                  {item.lastMessage.content}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700", fontFamily: typography.fontFamily.display },
  newButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  list: { flexGrow: 1, paddingBottom: 80 },
  separator: { height: 1, marginLeft: 80 },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowTime: { fontSize: 12, marginLeft: 8 },
  rowPreview: { fontSize: 13 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

export default ChatHistoryScreen;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/screens/ChatHistoryScreen.tsx
git commit -m "feat: add ChatHistoryScreen with conversation list and new chat"
```

---

### Task 16: Build ChatInterfaceScreen and wire navigation

**Files:**
- Create: `frontend/src/screens/ChatInterfaceScreen.tsx`
- Modify: `frontend/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Create ChatInterfaceScreen.tsx**

```typescript
// frontend/src/screens/ChatInterfaceScreen.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Platform, Pressable, Image, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import Markdown from "react-native-markdown-display";
import { colors, spacing, typography, radius, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import * as chatApi from "../api/chat";
import { ChatMessage } from "../types/chat";

interface UiMessage {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
}

const copyText = async (value: string) => {
  try { await Clipboard.setStringAsync(value); } catch { }
};

const AiMsgBubble = ({ msg, themedColors }: { msg: UiMessage; themedColors: any }) => {
  const markdownStyle = useMemo(() => ({
    body: { color: themedColors.textPrimary, fontFamily: typography.fontFamily.body, fontSize: 16 },
    link: { color: colors.primary },
  }), [themedColors]);

  return (
    <View style={styles.aiBubbleRow}>
      <View style={[styles.aiAvatar, { backgroundColor: colors.surfaceDarkLight }]}>
        <Ionicons name="wallet-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.aiBubbleContent}>
        <Text style={[styles.senderLabel, { color: themedColors.textSecondary }]}>FinanceBot</Text>
        <Pressable onLongPress={() => copyText(msg.text)} delayLongPress={250}>
          <View style={[styles.aiBubble, { backgroundColor: themedColors.surfaceLight }]}>
            <Markdown style={markdownStyle}>{msg.text}</Markdown>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const UserMsgBubble = ({ msg }: { msg: UiMessage }) => (
  <View style={styles.userBubbleRow}>
    <View style={styles.userBubbleContent}>
      <Text style={[styles.senderLabel, { color: colors.gray[500], textAlign: "right" }]}>You</Text>
      <Pressable onLongPress={() => copyText(msg.text)} delayLongPress={250}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{msg.text}</Text>
        </View>
      </Pressable>
    </View>
    <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
      <Text style={styles.userAvatarText}>ME</Text>
    </View>
  </View>
);

const ChatInterfaceScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { conversationId } = route.params as { conversationId: string };

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState("FinanceBot");
  const [pickedImage, setPickedImage] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const toUi = (msg: ChatMessage): UiMessage => ({
    id: msg._id || `m-${Date.now()}-${Math.random()}`,
    text: msg.content,
    isAI: msg.role === "assistant",
    timestamp: fmt(new Date(msg.timestamp)),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const conv = await chatApi.getConversation(conversationId);
        if (conv?.title && conv.title !== "New Chat") setTitle(conv.title);
        if (conv?.messages?.length) {
          setMessages(conv.messages.map(toUi));
        } else {
          setMessages([{
            id: "welcome",
            text: "Hi! I'm your AI Financial Coach. Ask me about your spending, budget, or financial goals. You can also attach a photo of a receipt or bank statement.",
            isAI: true,
            timestamp: fmt(new Date()),
          }]);
        }
      } catch { }
    };
    load();
  }, [conversationId]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to your photo library to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedImage({
        uri: asset.uri,
        base64: asset.base64 ?? "",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const handleSend = async () => {
    const content = inputText.trim();
    if ((!content && !pickedImage) || isSending) return;

    const displayText = content || "(Image attached)";
    setInputText("");
    setIsSending(true);

    const optimistic: UiMessage = {
      id: `local-${Date.now()}`,
      text: displayText,
      isAI: false,
      timestamp: fmt(new Date()),
    };
    setMessages((prev) => [...prev, optimistic]);

    const imageBase64 = pickedImage?.base64;
    const imageMimeType = pickedImage?.mimeType;
    setPickedImage(null);

    try {
      const response = await chatApi.sendMessage({
        content: displayText,
        conversationId,
        imageBase64,
        imageMimeType,
      });

      // Update title if it changed server-side
      if (response.conversationId) {
        try {
          const updated = await chatApi.getConversation(conversationId);
          if (updated?.title && updated.title !== "New Chat") setTitle(updated.title);
        } catch { }
      }

      setMessages((prev) => [...prev, toUi(response.message)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, text: "I'm having trouble connecting. Please try again.", isAI: true, timestamp: "" },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer
      backgroundColor={themedColors.background}
      withKeyboardAvoidingView={Platform.OS === "ios"}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themedColors.border, backgroundColor: themedColors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.onlineText, { color: themedColors.textSecondary }]}>Online</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) =>
          msg.isAI
            ? <AiMsgBubble key={msg.id} msg={msg} themedColors={themedColors} />
            : <UserMsgBubble key={msg.id} msg={msg} />
        )}
      </ScrollView>

      {/* Input area — no tab bar since this is a stack screen */}
      <View
        style={[
          styles.inputArea,
          {
            backgroundColor: themedColors.background,
            borderTopColor: themedColors.border,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        {/* Image preview */}
        {pickedImage && (
          <View style={styles.imagePreviewRow}>
            <Image source={{ uri: pickedImage.uri }} style={styles.imageThumb} />
            <TouchableOpacity onPress={() => setPickedImage(null)} style={styles.imageRemove}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
            <Text style={[styles.imageLabel, { color: themedColors.textSecondary }]}>Image attached</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.imageBtn}>
            <Ionicons name="image-outline" size={24} color={themedColors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: themedColors.surfaceAlt ?? themedColors.surface, borderColor: themedColors.border }]}>
            <TextInput
              style={[styles.input, { color: themedColors.textPrimary }]}
              placeholder="Ask about your finances..."
              placeholderTextColor={themedColors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, { opacity: (isSending || (!inputText.trim() && !pickedImage)) ? 0.5 : 1 }]}
            onPress={handleSend}
            disabled={isSending || (!inputText.trim() && !pickedImage)}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: typography.fontFamily.display },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11 },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.md, paddingBottom: 20, gap: spacing.md },
  aiBubbleRow: { flexDirection: "row", gap: 10, paddingRight: 40 },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: "auto" },
  aiBubbleContent: { flex: 1, gap: 4 },
  senderLabel: { fontSize: 12, marginLeft: 4 },
  aiBubble: { padding: 12, borderRadius: radius.xl, borderBottomLeftRadius: 4 },
  userBubbleRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, paddingLeft: 40 },
  userBubbleContent: { flex: 1, alignItems: "flex-end", gap: 4 },
  userBubble: { backgroundColor: colors.primary, padding: 12, borderRadius: radius.xl, borderBottomRightRadius: 4 },
  userBubbleText: { color: "#fff", fontSize: 16 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: "auto" },
  userAvatarText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  inputArea: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  imagePreviewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  imageThumb: { width: 48, height: 48, borderRadius: radius.lg },
  imageRemove: {},
  imageLabel: { fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  imageBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  inputWrapper: {
    flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, justifyContent: "center",
  },
  input: { fontSize: 16, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});

export default ChatInterfaceScreen;
```

- [ ] **Step 2: Update AppNavigator.tsx — replace AIChat tab, add ChatInterface and ChatHistory**

Replace the full `AppNavigator.tsx`:

```typescript
// frontend/src/navigation/AppNavigator.tsx
import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, useThemedColors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AuthNavigator from "./AuthNavigator";
import DashboardScreen from "../screens/DashboardScreen";
import ChatHistoryScreen from "../screens/ChatHistoryScreen";
import ChatInterfaceScreen from "../screens/ChatInterfaceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import LogTransactionScreen from "../screens/LogTransactionScreen";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import ScanReceiptScreen from "../screens/ScanReceiptScreen";

import { RootStackParamList, MainTabParamList } from "./types";
import { useAuthStore } from "../stores/authStore";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const themedColors = useThemedColors();
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;
  const tabBarBaseHeight = 68;
  const tabBarHeight = tabBarBaseHeight + androidBottomInset;

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: themedColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themedColors.surface,
          borderTopColor: themedColors.border,
          borderTopWidth: 1,
          paddingBottom: 12 + androidBottomInset,
          paddingTop: 10,
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
          position: "absolute",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: "Home",
        }}
      />
      <MainTab.Screen
        name="ChatHistory"
        component={ChatHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          tabBarLabel: "Coach",
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          tabBarLabel: "Profile",
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          tabBarLabel: "Settings",
        }}
      />
    </MainTab.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <RootStack.Screen name="LogTransaction" component={LogTransactionScreen} options={{ presentation: "modal" }} />
          <RootStack.Screen name="AllTransactions" component={AllTransactionsScreen} />
          <RootStack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ presentation: "modal" }} />
          <RootStack.Screen name="ChatInterface" component={ChatInterfaceScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const AppNavigator = () => (
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
);

export default AppNavigator;
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/screens/ChatInterfaceScreen.tsx frontend/src/screens/ChatHistoryScreen.tsx frontend/src/navigation/AppNavigator.tsx
git commit -m "feat: ChatHistoryScreen + ChatInterfaceScreen with image input, replace AIChat tab"
```

---

## Self-Review

**Spec coverage check:**
- ✅ auth.controller.ts — diet profile removed, financial fields used (Task 1)
- ✅ seed.ts — financial profile (Task 3)
- ✅ server.ts banner (Task 2)
- ✅ gemini/openai JSDoc comments (Task 2)
- ✅ transaction/user controller stale comments (Task 2)
- ✅ app.json name, slug, colours, bundle IDs, expo-image-picker (Task 4)
- ✅ AuthScreen.tsx deleted (Task 4)
- ✅ LoginScreen theming + label (Task 5)
- ✅ SignUpScreen currency removed, age added (Task 6)
- ✅ chat.ts types cleaned — diet metadata removed, ConversationSummary added (Task 6)
- ✅ ARCHITECTURE.md rewritten (Task 7)
- ✅ Dashboard spending summary wired (Task 8)
- ✅ AllTransactionsScreen with filters and grouping (Task 9)
- ✅ Navigation types updated (Task 9 Step 1)
- ✅ Profile persistence (Task 10)
- ✅ ScanReceiptScreen + LogTransaction prefill (Task 11)
- ✅ Chat model title field, multi-conversation (Task 12)
- ✅ Chat controller listConversations, createConversation, sendMessage with auto-title (Task 12)
- ✅ Chat routes updated (Task 12)
- ✅ IAIProvider interface updated for image params (Task 13)
- ✅ Gemini multimodal image support (Task 13)
- ✅ OpenAI vision support (Task 13)
- ✅ aiService.ts image pass-through (Task 13)
- ✅ chat.ts API client updated (Task 14)
- ✅ ChatHistoryScreen (Task 15)
- ✅ ChatInterfaceScreen with image picker (Task 16)
- ✅ AppNavigator replaced AIChat with ChatHistory, added ChatInterface stack (Task 16)

**Note for developer:** After completing all tasks, replace `frontend/assets/splash.png` and `frontend/assets/adaptive-icon.png` with finance-themed assets (wallet, chart, or abstract graphic). The background colour is already updated to `#2D9CDB` in `app.json`.
