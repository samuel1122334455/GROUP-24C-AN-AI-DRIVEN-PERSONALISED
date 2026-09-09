# Finance Pivot Cleanup & Feature Audit — Design Spec

**Date:** 2026-05-04
**Status:** Approved

---

## Overview

The app was originally built as an AI Diet Consultant and pivoted to an AI Financial Behavioral Coach. The AI system prompt, frontend screens, data models, and API routes were updated for finance — but the pivot was incomplete. This spec covers three phases:

1. **Cleanup** — Remove all remaining diet/nutrition references and fix the broken registration flow
2. **Bug Fixes** — Wire up broken features that exist in code but don't work
3. **New Features** — Build out stubbed UI actions into real screens, including a redesigned chat system

---

## Phase 1: Cleanup

Remove every diet/nutrition reference and fix the critical registration bug.

### Backend

**`backend/src/controllers/auth.controller.ts`** — Critical bug
- Delete the `calculateNutritionGoals()` function entirely (BMR calculation, calorie/macro math)
- Rewrite the `register()` normalizedProfile to use financial fields:
  - `age` (default 25)
  - `monthlyIncome` (default 0)
  - `primaryGoal` (default `"budget_control"`)
  - `riskTolerance` (default `"moderate"`)
  - `spendingCategories` (default `[]`)
- Remove the `nutritionGoals` spread from the `User.create()` call
- Registration currently fails silently because the User model schema expects financial fields but receives diet fields

**`backend/src/scripts/seed.ts`**
- Replace diet profile (`height`, `weight`, `goal: "maintain"`, `activityLevel`, `dietaryPreferences`, `dailyCalorieGoal`, `macroGoals`, `unitPreference`) with valid financial profile:
  ```ts
  profile: {
    age: 30,
    monthlyIncome: 4000,
    primaryGoal: "budget_control",
    riskTolerance: "moderate",
    spendingCategories: [],
  }
  ```

**`backend/src/server.ts`**
- Change banner: `"AI Diet Consultant Backend Server"` → `"AI Finance Coach Backend Server"`
- Remove `Meals:` line from the endpoint list in startup log

**`backend/src/services/ai/gemini.service.ts`**
- Rename JSDoc on `getSystemPrompt()`: `"Get system prompt for nutrition expert"` → `"Get system prompt for financial coach"`

**`backend/src/services/ai/openai.service.ts`**
- Same JSDoc rename on `getSystemPrompt()`
- Fix inline comment: `"Add system message with nutrition expert context"` → `"Add system message with financial coach context"`

**`backend/src/controllers/transaction.controller.ts`**
- Remove stale comment: `"Removed getMealSuggestions as it's not directly applicable..."`

**`backend/src/controllers/user.controller.ts`**
- Remove stale comments: `"Changed MealLog to Transaction"` (appears twice)

### Frontend — Splash Screen & App Config

**`frontend/app.json`**
- `name`: `"AI Diet Consultant"` → `"AI Finance Coach"`
- `slug`: `"ai-diet-consultant"` → `"ai-finance-coach"`
- `splash.backgroundColor`: `"#2f7f34"` → `"#2D9CDB"` (app primary blue)
- `android.adaptiveIcon.backgroundColor`: `"#2f7f34"` → `"#2D9CDB"`
- `ios.bundleIdentifier`: `"com.aidietconsultant.app"` → `"com.aifinancecoach.app"`
- `android.package`: `"com.aidietconsultant.app"` → `"com.aifinancecoach.app"`
- Add `"expo-image-picker"` to the `plugins` array (required for chat image input in Phase 3)

### Frontend — Auth Screens

**`frontend/src/screens/AuthScreen.tsx`** — Delete
- Dead placeholder file. Not referenced in `AuthNavigator`. Has no users.

**`frontend/src/screens/LoginScreen.tsx`** — Fix theming + label
- Replace all hardcoded `colors.textPrimaryLight` / `colors.textSecondaryLight` / `colors.gray[200]` with `themedColors` equivalents so dark mode renders correctly
- Change button label `"Connect"` → `"Log in"`

**`frontend/src/screens/SignUpScreen.tsx`** — Fix profile fields
- Remove `currency: "USD"` from the profile object sent to the API (field does not exist in User model)
- Add an age number input to the Financial Profile section (sits above the Monthly Income field). Label: "Your Age". Keyboard type: numeric. The AI coach uses age for personalized advice. Backend defaults to 25 if not provided.

### Documentation

**`ARCHITECTURE.md`** — Full rewrite
- Title: AI Finance Coach — Architecture Documentation
- Update System Overview to describe financial behavioral coaching app
- Update Database Schema section: remove Meal and MealLog collections; document correct User (financial profile), Transaction (with mood/trigger), and Chat (multi-conversation) schemas
- Update Data Flow section: replace "Daily Summary Flow" with "Spending Summary Flow"; replace meal-related flows with transaction flows
- Update all other sections to reflect the finance domain (no diet references)

---

## Phase 2: Bug Fixes

### 1. Dashboard Spending Summary Not Loading

**File:** `frontend/src/screens/DashboardScreen.tsx`

**Problem:** `getSpendingSummary()` call is commented out. The dashboard always shows `$0 spent of $100 limit` regardless of actual data.

**Fix:**
- Import `userApi` and call `userApi.getSpendingSummary()` in the `useEffect` on mount alongside `fetchTransactions()`
- Call `useUserStore.getState().setSpendingSummary(result.data)` with the response
- Also call it inside `onRefresh`
- The backend endpoint `GET /api/user/spending-summary` already exists and returns the correct shape

### 2. "See All" Transactions Broken

**Files:**
- `frontend/src/screens/AllTransactionsScreen.tsx` — new file
- `frontend/src/navigation/types.ts` — add `AllTransactions` route
- `frontend/src/navigation/AppNavigator.tsx` — register the screen
- `frontend/src/screens/DashboardScreen.tsx` — update "See All" press handler

**Problem:** "See All" navigates to `TransactionDetail` with `transactionId: "all"`. `TransactionDetailScreen` tries to find a transaction with `_id === "all"`, finds nothing, and shows "Loading..." forever.

**Fix:**
- Create `AllTransactionsScreen`: fetches all transactions (no date filter) on mount, groups them by date using `date-fns`
- Each date group: header with date label + daily total on the right
- Each row: category icon, description, mood badge, amount — taps into `TransactionDetailScreen`
- Filter bar (horizontal chips at top): All / Emotional / Food / Transport / Shopping / Bills / Entertainment / Health / Other
- Pull-to-refresh support
- Empty state: "No transactions yet. Start logging your spending!"
- Add `AllTransactions: undefined` to `RootStackParamList`
- Change the "See All" press to `navigation.navigate("AllTransactions")`

### 3. Profile Changes Not Persisted

**File:** `frontend/src/screens/ProfileScreen.tsx`

**Problem:** `handleGoalChange`, `handleRiskChange`, and `toggleCategory` update the Zustand store only. Changes are lost on app restart/refresh because the backend is never called.

**Fix:**
- Import `userApi` and call `userApi.updateProfile({ profile: { ... } })` in each handler
- `handleGoalChange` and `handleRiskChange`: call API immediately on selection
- `toggleCategory`: debounce the API call 500ms (fires on each chip tap; debounce prevents rapid successive requests)
- On API error, revert the local store state and show a brief error alert

---

## Phase 3: New Features

### 1. Scan Receipt Screen

**Files:**
- `frontend/src/screens/ScanReceiptScreen.tsx` — new file
- `frontend/src/navigation/types.ts` — add `ScanReceipt` route
- `frontend/src/navigation/AppNavigator.tsx` — register as modal
- `frontend/src/screens/DashboardScreen.tsx` — wire "Scan Receipt" button
- `frontend/src/screens/LogTransactionScreen.tsx` — accept pre-fill route params

**Design:**
- Modal presentation (same as LogTransaction)
- Receipt-themed card UI with a large text area: "Paste or type receipt text"
- "Parse Receipt" button: regex extracts dollar amount (`/\$?([\d,]+\.?\d*)/`) and merchant name (first non-numeric, non-symbol line)
- On parse, navigates to `LogTransactionScreen` with `{ prefill: { description, amount } }` as route params
- `LogTransactionScreen` reads `route.params?.prefill` on mount and pre-populates `amount` and `description` fields
- Close button dismisses the modal

### 2. All Transactions Screen

See Phase 2 — this screen is shared between the "See All" bug fix and this feature slot.

### 3. Chat History + Chat Interface (Redesign)

The single-conversation chat is replaced with a full multi-conversation system.

#### Backend Changes

**`backend/src/models/Chat.model.ts`**
- Add `title: { type: String, default: "New Chat" }` field
- Allow multiple Chat documents per user (remove any unique constraint on `userId`)

**`backend/src/controllers/chat.controller.ts`**
- Add `listConversations`: `GET /api/chat/conversations` — returns all Chat docs for the user, sorted by `updatedAt` desc, with only `_id`, `title`, `updatedAt`, and the last message preview (last element of `messages` array)
- Add `createConversation`: `POST /api/chat/conversations` — creates a new empty Chat doc, returns `{ _id, title }`
- Update `sendMessage`: now requires `conversationId` in the request body. After the first user message is added, if `messages.length === 1`, auto-set `title` to the first 50 chars of the user's message
- Update `getConversation`: already accepts `conversationId` param — no change needed
- Update `clearConversation`: delete single conversation by ID, not all for user

**`backend/src/routes/chat.routes.ts`**
- Add `GET /api/chat/conversations`
- Add `POST /api/chat/conversations`

#### Frontend Changes

**`frontend/src/screens/ChatHistoryScreen.tsx`** — new file (replaces AIChatScreen as tab target)
- Fetches conversation list from `GET /api/chat/conversations` on mount
- Each row: conversation title, last message preview (truncated to 60 chars), relative timestamp
- "New Chat" button in top-right header — calls `POST /api/chat/conversations`, then navigates to `ChatInterfaceScreen` with the new `conversationId`
- Tapping a row navigates to `ChatInterfaceScreen` with `{ conversationId }`
- Pull-to-refresh
- Empty state: "No conversations yet. Tap + to start your first chat."

**`frontend/src/screens/ChatInterfaceScreen.tsx`** — new file (replaces AIChatScreen)
- Stack screen outside `MainTabNavigator` — tab bar is hidden when on this screen
- Back arrow navigates back to `ChatHistoryScreen`
- Header shows the conversation title
- Messages scroll area: existing markdown rendering, existing copy-on-long-press
- Bottom input bar:
  - Image picker icon (left) — opens `expo-image-picker` gallery picker; selected image shows as thumbnail preview above the input bar with an X to remove
  - Text input (center/flex) — multiline, placeholder: "Ask about your finances..."
  - Send button (right) — disabled when empty and not sending
- Image + text sent together: frontend sends `{ content, conversationId, imageBase64?, imageMimeType? }` to `POST /api/chat/message`
- Backend passes image to Gemini as `inlineData` in the multimodal parts array alongside the text
- Image is NOT stored in MongoDB — only the text content of the message is persisted

**`frontend/src/api/chat.ts`** — update
- Add `listConversations()` → `GET /api/chat/conversations`
- Add `createConversation()` → `POST /api/chat/conversations`
- Update `sendMessage()` to accept `{ content, conversationId, imageBase64?, imageMimeType? }`

**`frontend/src/navigation/types.ts`**
- Add `ChatHistory: undefined` to `MainTabParamList` (replaces `AIChat`)
- Add `ChatInterface: { conversationId: string }` to `RootStackParamList`

**`frontend/src/navigation/AppNavigator.tsx`**
- Replace `AIChat` tab with `ChatHistory` tab (same icon and label "Coach")
- Add `ChatInterface` as a stack screen outside the tab navigator

**`backend/src/services/ai/gemini.service.ts`** — update `chat()` method
- Accept optional `imageBase64` and `imageMimeType` params
- When present, build a multimodal `parts` array: `[{ text: fullPrompt }, { inlineData: { mimeType, data: imageBase64 } }]`
- Pass to `model.generateContent(parts)` instead of the plain string

**`backend/src/services/ai/openai.service.ts`** — update `chat()` method
- Accept optional `imageBase64` and `imageMimeType` params
- When present, use the vision message format: `{ role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: "data:mimeType;base64,..." } }] }`

**`backend/src/services/ai/provider.interface.ts`** — update `IAIProvider`
- Add optional `imageBase64?: string` and `imageMimeType?: string` to the `chat()` method signature

### 4. Splash Screen Asset

The splash image at `frontend/assets/splash.png` currently shows a diet/food graphic. Since we cannot generate images here, update the splash background color in `app.json` to `#2D9CDB` and set `resizeMode` to `"contain"` (already set). The developer should replace `splash.png` and `adaptive-icon.png` with finance-appropriate assets (wallet, chart, or abstract graphic).

---

## Navigation Changes Summary

**`RootStackParamList` additions:**
```ts
AllTransactions: undefined;
ScanReceipt: undefined;
ChatInterface: { conversationId: string };
```

**`MainTabParamList` change:**
```ts
// Remove: AIChat: undefined
// Add:    ChatHistory: undefined
```

**`AppNavigator.tsx` additions (authenticated stack):**
```tsx
<RootStack.Screen name="AllTransactions" component={AllTransactionsScreen} />
<RootStack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ presentation: 'modal' }} />
<RootStack.Screen name="ChatInterface" component={ChatInterfaceScreen} />
```

---

## Architecture After Changes

### Backend Routes (final)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/spending-summary
DELETE /api/user/account
GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/chat/conversations
POST   /api/chat/conversations
POST   /api/chat/message
GET    /api/chat/conversation/:conversationId
DELETE /api/chat/conversation/:conversationId
```

### Frontend Screens (final)
```
Auth flow:   Landing → Login / SignUp / ForgotPassword
Main tabs:   Dashboard | ChatHistory (Coach) | Profile | Settings
Modals:      LogTransaction, ScanReceipt
Stack:       TransactionDetail, AllTransactions, ChatInterface
```

### Data Models (final)
```
User:        { email, password, name, profile: { age, monthlyIncome, riskTolerance, primaryGoal, spendingCategories }, refreshTokens }
Transaction: { userId, description, amount, category, mood, trigger, notes, date }
Chat:        { userId, title, messages: [{ role, content, timestamp }] }
```
