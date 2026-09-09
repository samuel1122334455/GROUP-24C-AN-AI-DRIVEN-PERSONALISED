# Design: Onboarding, Push Notifications & Settings
**Date:** 2026-05-04
**Status:** Approved

---

## Overview

Three interconnected features:
1. **Conversational Onboarding** — first-run chat UI that collects profile data and generates a personalised financial analysis
2. **Push Notifications** — real spending alerts (triggered on transaction save), weekly AI-generated reports, and daily check-ins
3. **Settings Screen** — functional preference toggles with backend persistence, including currency selection

---

## 1. Conversational Onboarding

### Trigger
Shown once, immediately after first login. Gated by `hasCompletedOnboarding: Boolean` on the User document (default `false`). AppNavigator checks this flag and renders `OnboardingScreen` instead of `Main` when `false`.

### UI
Full-screen dark background matching the app theme. Chat-bubble layout: coach messages appear on the left (blue avatar + bubble), user answers appear on the right (white/accent bubble). Each exchange animates in sequentially — coach message appears first, then after a short delay (600ms) the input area fades in.

### Question Sequence
| # | Coach message | Input type |
|---|---|---|
| 1 | "Hi [name]! I'm your AI Finance Coach. First — what currency do you use?" | Searchable modal picker (all ISO 4217 currencies via `currency-codes` package). Stores code + symbol in `userPrefs.currency`. |
| 2 | "Great! What's your monthly income?" | Numeric TextInput prefixed with selected currency symbol + "Next" button |
| 3 | "How much do you want to save each month?" | Numeric TextInput prefixed with currency symbol. Stored as `profile.monthlySavingsTarget`. Used instead of hardcoded 20% in the projection chart. |
| 4 | "How old are you?" | Numeric TextInput + "Next" |
| 5 | "What's your main financial goal right now?" | 4 tap-chips: Emergency Fund / Pay Off Debt / Invest / Budget Control |
| 6 | "How do you feel about financial risk?" | 3 tap-chips: Conservative / Moderate / Aggressive |
| 7 | "Which categories do you usually spend on?" | Multi-select chips: Food / Transport / Health / Shopping / Bills / Fun |

Name is already known from registration — used in the opening message.

### Analysis Card
After the final answer, the coach sends one more message: "Here's your personalised financial snapshot 👇". Then an inline card appears containing:

**Savings Projection Chart**
- Line chart (Victory Native or react-native-chart-kit) showing projected cumulative savings over 12 months
- Uses `profile.monthlySavingsTarget` entered in step 3 (no hardcoded percentage)
- X-axis: months (Jan–Dec), Y-axis: cumulative savings prefixed with the user's currency symbol
- Accent color line, subtle fill below

**3 Stat Cards** (horizontal row below chart):
- 💰 Daily Budget: `Math.round(monthlyIncome / 30)` formatted with user's currency
- 🎯 Goal Timeline: estimated months to reach a goal milestone (e.g. 3× monthly income for emergency fund, derived from 20% savings rate)
- 📊 Risk Profile: badge chip (Conservative / Moderate / Aggressive) with appropriate colour

**Coach Message**
2-sentence personalised summary referencing name + goal. Example: "Based on your income, you can save $600/month toward your Emergency Fund. At this rate you'll hit your 3-month safety net in about 15 months — let's make it happen."

**CTA Button**: "Let's Start" → sets `hasCompletedOnboarding = true` via `PUT /user/profile` (existing endpoint), then navigates to Main.

### Backend
- Add `hasCompletedOnboarding: { type: Boolean, default: false }` to UserSchema
- Add `profile.monthlySavingsTarget: { type: Number, default: 0, min: 0 }` to UserProfileSchema
- `updateProfile` already handles partial updates via `findByIdAndUpdate` — no new endpoint needed

---

## 2. Push Notifications

### Data Model Changes (User)

```ts
// New fields added to UserSchema
userPrefs: {
  spendingAlerts: { type: Boolean, default: true },
  weeklyReport:   { type: Boolean, default: true },
  checkIn:        { type: Boolean, default: true },
  currency:       { type: String,  default: 'USD' },  // ISO 4217 code
}
pushToken:              { type: String,  default: null }
hasCompletedOnboarding: { type: Boolean, default: false }
notifiedToday: {
  alert80:  { type: Date, default: null },
  alert100: { type: Date, default: null },
}

// Added to UserProfileSchema
monthlySavingsTarget: { type: Number, default: 0, min: 0 }
```

### New Model: WeeklyReport

```ts
{
  userId:       ObjectId (ref User)
  weekStart:    Date           // Monday 00:00
  weekEnd:      Date           // Sunday 23:59
  totalSpent:   Number
  topCategory:  String
  txCount:      Number
  aiSummary:    String         // AI-generated coach text
  createdAt:    Date
}
```

### New Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/user/push-token` | Store Expo push token on User |
| GET  | `/user/reports` | List all WeeklyReports for user (summary list) |
| GET  | `/user/reports/:id` | Single WeeklyReport (full detail) |

### Token Registration (Frontend)
On app start (in `App.tsx`), after `loadTokens()` resolves and `isAuthenticated` is true:
1. Call `Notifications.requestPermissionsAsync()`
2. If granted, call `Notifications.getExpoPushTokenAsync()`
3. POST token to `/user/push-token` — store in User document

### Spending Alert (triggered on transaction save)

In `transaction.controller.ts`, after a transaction is saved:
1. Fetch today's total spent for the user
2. Fetch user's `userPrefs.spendingAlerts` and `pushToken`
3. Compute `dailyBudget = monthlyIncome / 30`
4. Check thresholds:
   - ≥ 80% and < 100%: send "⚠️ Heads up, [name]! You've used 80% of today's $X budget."
   - ≥ 100%: send "🚨 Daily limit reached! You've spent $X today. The coach has tips — tap to see."
5. Deduplicate using a `notifiedToday: { alert80: Date, alert100: Date }` sub-field on User, only fire if the relevant date isn't today.

Notification sends via Expo Push API (`https://exp.host/--/api/v2/push/send`) using axios — no FCM/APNs config required.

### Weekly Report (cron: Sunday 8pm)

Uses `node-cron` — schedule `'0 20 * * 0'`:
1. Fetch all users with `userPrefs.weeklyReport: true` and a `pushToken`
2. For each user: fetch transactions from Mon–Sun of the current week
3. Build a stats object: `{ totalSpent, topCategory, txCount, savedVsBudget }` where `savedVsBudget = (dailyBudget × 7) - totalSpent` (positive = under budget, negative = over)
4. Send to AI with prompt: *"You are a supportive finance coach. Write a 3-sentence weekly summary for [name]. Stats: [json]. Be encouraging, reference the top spending category, and give one actionable improvement tip."*
5. Save a `WeeklyReport` document
6. Push notification: "Your weekly summary is ready 📊 — tap to see what your coach noticed"
7. Notification `data` payload: `{ screen: 'WeeklyReport', reportId: <id> }`

### Check-in (cron: daily 8am)

Uses `node-cron` — schedule `'0 8 * * *'`:
1. Fetch all users with `userPrefs.checkIn: true` and a `pushToken`
2. For each user: check if any transaction exists with `date >= today 00:00`
3. If none: push "Good morning, [name]! 💰 Your daily budget is $X — tap to log your first spend"
4. If transactions exist: skip

### Frontend Notification Handling

In `App.tsx`, register a `Notifications.addNotificationResponseReceivedListener`:
- If `data.screen === 'WeeklyReport'` and `data.reportId` exists → navigate to `WeeklyReportScreen` with that ID
- If `data.screen === 'LogTransaction'` → navigate to `LogTransaction`

### WeeklyReportScreen

New stack screen (`/src/screens/WeeklyReportScreen.tsx`):
- Header: "Weekly Report — [week date range]"
- Body: coach summary text (AI-generated), then stats (total spent, top category, tx count, saved vs budget)
- **Download PDF** button: uses `expo-print` to render an HTML template of the report to PDF, then `expo-sharing` to share/save
- Accessible from: push notification deep-link AND Profile screen "Past Reports" list

### Profile Screen — Past Reports Section

New section at the bottom of `ProfileScreen.tsx`:
- Title "Past Reports"
- `FlatList` of `WeeklyReport` items — each row shows the week date range + total spent + a chevron
- Tapping a row navigates to `WeeklyReportScreen` with that report's ID
- Fetched from `GET /user/reports` on profile screen mount

---

## 3. Settings Screen

### What Changes

Current toggles for Spending Alerts, Weekly Report, and Check-ins are wired to `user.userPrefs` via the existing `updateProfile` endpoint. Currency picker persists the same way.

### userPrefs Read/Write Pattern

On Settings screen mount: read toggle state from `useUserStore().user.userPrefs`. On toggle change: call `userApi.updateProfile({ userPrefs: { [key]: value } })` — optimistic update in store, revert on error.

### Currency Picker

A row in the Settings screen opens a searchable modal using the `currency-codes` npm package (all ISO 4217 currencies — same component reused from onboarding). Selecting one calls `updateProfile({ userPrefs: { currency: 'GBP' } })`. All monetary displays across the app read `user.userPrefs.currency` from the store and prepend the matching symbol (e.g. £, €, ₵) derived from the `currency-codes` package. No FX conversion — amounts stay as entered, only the symbol changes.

---

## Navigation Changes

New screens to register in `AppNavigator.tsx`:
- `OnboardingScreen` — rendered instead of `Main` when `!hasCompletedOnboarding`
- `WeeklyReportScreen` — stack screen under `Main`

New type entries in `navigation/types.ts`:
- `WeeklyReport: { reportId: string }`

---

## Packages Required

**Frontend:**
- `expo-notifications` (push token + listener)
- `expo-print` (PDF generation)
- `expo-sharing` (share/save PDF)
- `victory-native` or `react-native-chart-kit` (savings line chart in onboarding)
- `currency-codes` (full ISO 4217 currency list with codes, names, and symbols — used in onboarding picker and Settings currency selector)

**Backend:**
- `node-cron` (weekly report + check-in jobs)
- `axios` (already installed — used for Expo Push API calls)

---

## Out of Scope
- Email notifications
- In-app notification inbox / history
- Custom notification schedule (user-set time)
- Multi-currency conversion / FX rates
