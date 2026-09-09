# Onboarding, Push Notifications & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversational onboarding flow, real push notifications (spending alerts, weekly AI reports, daily check-ins), and functional Settings preferences with persisted currency selection.

**Architecture:** Backend gains a `NotificationService` (Expo Push API wrapper), a `CronService` (node-cron weekly/daily jobs), a `WeeklyReport` model, and new user fields (`userPrefs`, `pushToken`, `hasCompletedOnboarding`, `notifiedToday`, `profile.monthlySavingsTarget`). Frontend gains an `OnboardingScreen` (chat-bubble UI), `WeeklyReportScreen` (report detail + PDF), `CurrencyPicker` component (all ISO 4217 via `currency-codes`), and wires Settings toggles to the backend.

**Tech Stack:** node-cron, expo-notifications, expo-print, expo-sharing, react-native-chart-kit, currency-codes, Expo Push API (no FCM/APNs config needed)

---

## Phase 1 — Backend Foundation

### Task 1: Install backend packages

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install node-cron**

```bash
cd backend && npm install node-cron && npm install --save-dev @types/node-cron
```

Expected output: added `node-cron` to dependencies, `@types/node-cron` to devDependencies.

- [ ] **Step 2: Verify install**

```bash
cd backend && node -e "require('node-cron'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
cd backend && git add package.json package-lock.json
git commit -m "chore: add node-cron for scheduled notification jobs"
```

---

### Task 2: Update User model — new fields

**Files:**
- Modify: `backend/src/models/User.model.ts`

- [ ] **Step 1: Add `monthlySavingsTarget` to `IUserProfile` and `UserProfileSchema`**

In `backend/src/models/User.model.ts`, update the interface and schema:

```typescript
// IUserProfile interface — add:
monthlySavingsTarget: number;

// UserProfileSchema — add:
monthlySavingsTarget: { type: Number, default: 0, min: 0 },
```

- [ ] **Step 2: Add new fields to `IUser` interface**

```typescript
// Add to IUser interface (after refreshTokens):
pushToken: string | null;
hasCompletedOnboarding: boolean;
userPrefs: {
  spendingAlerts: boolean;
  weeklyReport: boolean;
  checkIn: boolean;
  currency: string;
};
notifiedToday: {
  alert80: Date | null;
  alert100: Date | null;
};
```

- [ ] **Step 3: Add corresponding Mongoose schema fields**

After the `refreshTokens` field in `UserSchema`:

```typescript
pushToken: { type: String, default: null },
hasCompletedOnboarding: { type: Boolean, default: false },
userPrefs: {
  spendingAlerts: { type: Boolean, default: true },
  weeklyReport:   { type: Boolean, default: true },
  checkIn:        { type: Boolean, default: true },
  currency:       { type: String, default: 'USD' },
},
notifiedToday: {
  alert80:  { type: Date, default: null },
  alert100: { type: Date, default: null },
},
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/User.model.ts
git commit -m "feat: add userPrefs, pushToken, onboarding flag, notifiedToday, monthlySavingsTarget to User model"
```

---

### Task 3: WeeklyReport model

**Files:**
- Create: `backend/src/models/WeeklyReport.model.ts`

- [ ] **Step 1: Create the model**

```typescript
// backend/src/models/WeeklyReport.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklyReport extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  totalSpent: number;
  topCategory: string;
  txCount: number;
  aiSummary: string;
  createdAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart:   { type: Date, required: true },
    weekEnd:     { type: Date, required: true },
    totalSpent:  { type: Number, required: true },
    topCategory: { type: String, required: true },
    txCount:     { type: Number, required: true },
    aiSummary:   { type: String, required: true },
  },
  { timestamps: true }
);

export const WeeklyReport = mongoose.model<IWeeklyReport>("WeeklyReport", WeeklyReportSchema);
export default WeeklyReport;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/WeeklyReport.model.ts
git commit -m "feat: add WeeklyReport model"
```

---

### Task 4: Notification service

**Files:**
- Create: `backend/src/services/notification.service.ts`
- Create: `backend/src/__tests__/notification.service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// backend/src/__tests__/notification.service.test.ts
import { shouldSend80Alert, shouldSend100Alert, computeSpendingPct } from "../services/notification.service";

describe("computeSpendingPct", () => {
  it("returns correct percentage", () => {
    expect(computeSpendingPct(80, 100)).toBeCloseTo(0.8);
    expect(computeSpendingPct(100, 100)).toBeCloseTo(1.0);
    expect(computeSpendingPct(50, 100)).toBeCloseTo(0.5);
  });

  it("returns 0 when budget is 0", () => {
    expect(computeSpendingPct(50, 0)).toBe(0);
  });
});

describe("shouldSend80Alert", () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  it("returns true when pct >= 0.8 and not yet notified today", () => {
    expect(shouldSend80Alert(0.81, null)).toBe(true);
    expect(shouldSend80Alert(1.0, null)).toBe(true);
  });

  it("returns false when pct < 0.8", () => {
    expect(shouldSend80Alert(0.79, null)).toBe(false);
  });

  it("returns false when already notified today", () => {
    expect(shouldSend80Alert(0.85, new Date())).toBe(false);
  });

  it("returns true when notified yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(shouldSend80Alert(0.85, yesterday)).toBe(true);
  });
});

describe("shouldSend100Alert", () => {
  it("returns true when pct >= 1.0 and not yet notified today", () => {
    expect(shouldSend100Alert(1.0, null)).toBe(true);
    expect(shouldSend100Alert(1.5, null)).toBe(true);
  });

  it("returns false when pct < 1.0", () => {
    expect(shouldSend100Alert(0.99, null)).toBe(false);
  });

  it("returns false when already notified today", () => {
    expect(shouldSend100Alert(1.2, new Date())).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && npx jest notification.service --no-coverage
```

Expected: FAIL — functions not defined yet.

- [ ] **Step 3: Implement the service**

```typescript
// backend/src/services/notification.service.ts
import axios from "axios";
import { User } from "../models/User.model";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export const sendPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  await axios.post(EXPO_PUSH_URL, {
    to: pushToken,
    title,
    body,
    data,
    sound: "default",
  });
};

export const computeSpendingPct = (spent: number, budget: number): number => {
  if (budget === 0) return 0;
  return spent / budget;
};

export const shouldSend80Alert = (pct: number, lastAlert80: Date | null): boolean => {
  if (pct < 0.8 || pct >= 1.0) return false;
  if (!lastAlert80) return true;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return new Date(lastAlert80) < todayStart;
};

export const shouldSend100Alert = (pct: number, lastAlert100: Date | null): boolean => {
  if (pct < 1.0) return false;
  if (!lastAlert100) return true;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return new Date(lastAlert100) < todayStart;
};

export const checkAndSendSpendingAlert = async (
  userId: string,
  totalSpent: number
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user || !user.pushToken || !user.userPrefs?.spendingAlerts) return;

  const dailyBudget = user.profile.monthlyIncome > 0
    ? Math.round(user.profile.monthlyIncome / 30)
    : 100;

  const pct = computeSpendingPct(totalSpent, dailyBudget);
  const symbol = user.userPrefs?.currency ?? "USD";

  if (shouldSend100Alert(pct, user.notifiedToday?.alert100 ?? null)) {
    await sendPushNotification(
      user.pushToken,
      "🚨 Daily limit reached!",
      `You've spent ${symbol} ${totalSpent.toFixed(2)} today. The coach has tips — tap to see.`,
      { screen: "ChatHistory" }
    );
    await User.updateOne({ _id: userId }, { "notifiedToday.alert100": new Date() });
  } else if (shouldSend80Alert(pct, user.notifiedToday?.alert80 ?? null)) {
    await sendPushNotification(
      user.pushToken,
      "⚠️ Heads up!",
      `You've used 80% of today's ${symbol} ${dailyBudget} budget.`
    );
    await User.updateOne({ _id: userId }, { "notifiedToday.alert80": new Date() });
  }
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd backend && npx jest notification.service --no-coverage
```

Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/notification.service.ts backend/src/__tests__/notification.service.test.ts
git commit -m "feat: add notification service with spending alert logic"
```

---

### Task 5: AI service — generateText helper

**Files:**
- Modify: `backend/src/services/ai/aiService.ts`

- [ ] **Step 1: Add `generateText` method to the `AIService` class**

Add after the `chat` method (line ~95):

```typescript
async generateText(prompt: string): Promise<string> {
  const response = await this.chat([{ role: "user", content: prompt }]);
  return response.content;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/ai/aiService.ts
git commit -m "feat: add generateText helper to AIService"
```

---

### Task 6: Cron service

**Files:**
- Create: `backend/src/services/cron.service.ts`

- [ ] **Step 1: Create the cron service**

```typescript
// backend/src/services/cron.service.ts
import cron from "node-cron";
import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";
import { WeeklyReport } from "../models/WeeklyReport.model";
import { sendPushNotification } from "./notification.service";
import { aiService } from "./ai/aiService";

const getWeekBounds = (): { weekStart: Date; weekEnd: Date } => {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  return { weekStart, weekEnd };
};

const runWeeklyReports = async (): Promise<void> => {
  const users = await User.find({
    "userPrefs.weeklyReport": true,
    pushToken: { $ne: null },
  });

  const { weekStart, weekEnd } = getWeekBounds();

  for (const user of users) {
    try {
      const txs = await Transaction.find({
        userId: user._id,
        date: { $gte: weekStart, $lte: weekEnd },
      });

      const totalSpent = txs.reduce((sum, t) => sum + t.amount, 0);

      const categorySums: Record<string, number> = {};
      txs.forEach((t) => {
        categorySums[t.category] = (categorySums[t.category] ?? 0) + t.amount;
      });
      const topCategory =
        Object.keys(categorySums).sort((a, b) => categorySums[b] - categorySums[a])[0] ?? "General";

      const dailyBudget = user.profile.monthlyIncome > 0
        ? Math.round(user.profile.monthlyIncome / 30)
        : 100;
      const savedVsBudget = dailyBudget * 7 - totalSpent;
      const currency = user.userPrefs?.currency ?? "USD";

      const prompt = `You are a supportive finance coach. Write a 3-sentence weekly summary for ${user.name}. Stats: total spent ${currency} ${totalSpent.toFixed(2)}, top spending category: ${topCategory}, number of transactions: ${txs.length}, ${savedVsBudget >= 0 ? `saved ${currency} ${savedVsBudget.toFixed(2)} under budget` : `went ${currency} ${Math.abs(savedVsBudget).toFixed(2)} over budget`}. Be warm and encouraging, reference the top category specifically, and close with one concrete improvement tip for next week.`;

      const aiSummary = await aiService.generateText(prompt);

      const report = await WeeklyReport.create({
        userId: user._id,
        weekStart,
        weekEnd,
        totalSpent,
        topCategory,
        txCount: txs.length,
        aiSummary,
      });

      await sendPushNotification(
        user.pushToken!,
        "Your weekly summary is ready 📊",
        "Tap to see what your coach noticed this week.",
        { screen: "WeeklyReport", reportId: report._id.toString() }
      );
    } catch (err) {
      console.error(`[CronService] Weekly report failed for user ${user._id}:`, err);
    }
  }
};

const runDailyCheckIns = async (): Promise<void> => {
  const users = await User.find({
    "userPrefs.checkIn": true,
    pushToken: { $ne: null },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const user of users) {
    try {
      const txToday = await Transaction.findOne({
        userId: user._id,
        date: { $gte: todayStart },
      });

      if (!txToday) {
        const dailyBudget = user.profile.monthlyIncome > 0
          ? Math.round(user.profile.monthlyIncome / 30)
          : 100;
        const currency = user.userPrefs?.currency ?? "USD";
        const firstName = user.name.split(" ")[0];

        await sendPushNotification(
          user.pushToken!,
          `Good morning, ${firstName}! 💰`,
          `Your daily budget is ${currency} ${dailyBudget} — tap to log your first spend.`,
          { screen: "LogTransaction" }
        );
      }
    } catch (err) {
      console.error(`[CronService] Check-in failed for user ${user._id}:`, err);
    }
  }
};

export const startCronJobs = (): void => {
  // Weekly report: every Sunday at 8pm
  cron.schedule("0 20 * * 0", () => {
    console.log("[CronService] Running weekly reports...");
    runWeeklyReports().catch(console.error);
  });

  // Daily check-in: every day at 8am
  cron.schedule("0 8 * * *", () => {
    console.log("[CronService] Running daily check-ins...");
    runDailyCheckIns().catch(console.error);
  });

  console.log("✅ Cron jobs registered: weekly reports (Sun 8pm), daily check-ins (8am)");
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/cron.service.ts
git commit -m "feat: add cron service for weekly reports and daily check-ins"
```

---

### Task 7: User controller — push-token + reports endpoints

**Files:**
- Modify: `backend/src/controllers/user.controller.ts`

- [ ] **Step 1: Add import for WeeklyReport at the top**

```typescript
import { WeeklyReport } from "../models/WeeklyReport.model";
```

- [ ] **Step 2: Extend `updateProfile` to handle `userPrefs` and `hasCompletedOnboarding`**

The existing `updateProfile` controller only processes `name` and `profile`. Replace the `updateFields` building block with:

```typescript
const updateFields: Record<string, any> = {};
if (name) updateFields.name = name;
if (profile) {
  Object.entries(profile).forEach(([k, v]) => {
    updateFields[`profile.${k}`] = v;
  });
}
if (req.body.userPrefs) {
  Object.entries(req.body.userPrefs as Record<string, unknown>).forEach(([k, v]) => {
    updateFields[`userPrefs.${k}`] = v;
  });
}
if (typeof req.body.hasCompletedOnboarding === "boolean") {
  updateFields.hasCompletedOnboarding = req.body.hasCompletedOnboarding;
}
```

- [ ] **Step 3: Add `savePushToken` handler after `deleteAccount`**

```typescript
export const savePushToken = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== "string") {
      throw new AppError("pushToken is required", 400);
    }

    await User.findByIdAndUpdate(userId, { pushToken });

    res.status(200).json({ success: true, message: "Push token saved" });
  }
);

export const getReports = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const reports = await WeeklyReport.find({ userId })
      .sort({ createdAt: -1 })
      .select("weekStart weekEnd totalSpent topCategory txCount createdAt");

    res.status(200).json({ success: true, data: reports });
  }
);

export const getReportById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const report = await WeeklyReport.findOne({ _id: req.params.id, userId });
    if (!report) throw new AppError("Report not found", 404);

    res.status(200).json({ success: true, data: report });
  }
);
```

- [ ] **Step 3: Add to the default export**

```typescript
export default {
  getProfile,
  updateProfile,
  getSpendingSummary,
  deleteAccount,
  savePushToken,
  getReports,
  getReportById,
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/user.controller.ts
git commit -m "feat: add savePushToken, getReports, getReportById endpoints"
```

---

### Task 8: User routes — wire new endpoints

**Files:**
- Modify: `backend/src/routes/user.routes.ts`

- [ ] **Step 1: Read current routes file to see its structure**

Open `backend/src/routes/user.routes.ts` and add the three new routes after the existing ones:

```typescript
import { savePushToken, getReports, getReportById } from "../controllers/user.controller";

// Add after existing routes:
router.post("/push-token", authenticate, savePushToken);
router.get("/reports", authenticate, getReports);
router.get("/reports/:id", authenticate, getReportById);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/user.routes.ts
git commit -m "feat: register push-token and reports routes"
```

---

### Task 9: Transaction controller — spending alert trigger

**Files:**
- Modify: `backend/src/controllers/transaction.controller.ts`

- [ ] **Step 1: Add import for notification service at the top**

```typescript
import { checkAndSendSpendingAlert } from "../services/notification.service";
```

- [ ] **Step 2: Find the `createTransaction` handler. After the transaction is saved, add the alert check**

Locate the line where the transaction is saved (e.g., `const transaction = await Transaction.create(...)` or `await transaction.save()`). Immediately after it, add:

```typescript
// Fire-and-forget — don't let alert failure block the response
const userId = req.user?.userId!;
Transaction.find({
  userId,
  date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
}).then((todayTxs) => {
  const todayTotal = todayTxs.reduce((sum, t) => sum + t.amount, 0);
  checkAndSendSpendingAlert(userId, todayTotal).catch(console.error);
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/transaction.controller.ts
git commit -m "feat: trigger spending alert check after transaction is saved"
```

---

### Task 10: Wire cron service to server startup

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Import and call `startCronJobs` after the server starts**

In `backend/src/server.ts`, add the import and the call inside the server start callback (after the `console.log` that says the server is running):

```typescript
import { startCronJobs } from "./services/cron.service";

// Inside the app.listen callback, after existing logs:
startCronJobs();
```

- [ ] **Step 2: Start backend and verify cron logs appear**

```bash
cd backend && npm run dev
```

Expected in logs: `✅ Cron jobs registered: weekly reports (Sun 8pm), daily check-ins (8am)`

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: start cron jobs on server startup"
```

---

## Phase 2 — Frontend Foundation

### Task 11: Install frontend packages

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd frontend && npx expo install expo-notifications expo-print expo-sharing && npm install currency-codes react-native-chart-kit
```

- [ ] **Step 2: Add expo-notifications plugin to `app.json`**

In `frontend/app.json`, add `"expo-notifications"` to the `plugins` array:

```json
"plugins": ["expo-secure-store", "expo-image-picker", "expo-notifications"]
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/app.json
git commit -m "chore: install expo-notifications, expo-print, expo-sharing, currency-codes, react-native-chart-kit"
```

---

### Task 12: Update frontend types

**Files:**
- Modify: `frontend/src/types/user.ts`

- [ ] **Step 1: Read the current file**

Open `frontend/src/types/user.ts` and add the following new types and fields:

```typescript
// Add new interface:
export interface UserPrefs {
  spendingAlerts: boolean;
  weeklyReport: boolean;
  checkIn: boolean;
  currency: string;
}

// Add to UserProfile interface:
monthlySavingsTarget?: number;

// Add to User interface:
userPrefs?: UserPrefs;
hasCompletedOnboarding?: boolean;
```

- [ ] **Step 2: Add WeeklyReport type** (new file)

```typescript
// frontend/src/types/report.ts
export interface WeeklyReportSummary {
  _id: string;
  weekStart: string;
  weekEnd: string;
  totalSpent: number;
  topCategory: string;
  txCount: number;
  createdAt: string;
}

export interface WeeklyReportDetail extends WeeklyReportSummary {
  aiSummary: string;
}
```

- [ ] **Step 3: Update navigation types**

In `frontend/src/navigation/types.ts`, add:

```typescript
// In RootStackParamList (authenticated routes):
Onboarding: undefined;
WeeklyReport: { reportId: string };
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/user.ts frontend/src/types/report.ts frontend/src/navigation/types.ts
git commit -m "feat: add UserPrefs, WeeklyReport types, navigation params"
```

---

### Task 13: Currency utility + CurrencyPicker component

**Files:**
- Create: `frontend/src/utils/currency.ts`
- Create: `frontend/src/components/common/CurrencyPicker.tsx`
- Create: `frontend/src/__tests__/currency.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/__tests__/currency.test.ts
import { getCurrencySymbol, generateProjectionData, getGoalTimelineLabel } from "../utils/currency";

describe("getCurrencySymbol", () => {
  it("returns $ for USD", () => expect(getCurrencySymbol("USD")).toBe("$"));
  it("returns £ for GBP", () => expect(getCurrencySymbol("GBP")).toBe("£"));
  it("returns € for EUR", () => expect(getCurrencySymbol("EUR")).toBe("€"));
  it("returns the code itself as fallback for unknown code", () => {
    expect(getCurrencySymbol("FAKE")).toBe("FAKE");
  });
});

describe("generateProjectionData", () => {
  it("returns 12 months of cumulative savings", () => {
    const result = generateProjectionData(500);
    expect(result).toHaveLength(12);
    expect(result[0]).toBe(500);
    expect(result[5]).toBe(3000);
    expect(result[11]).toBe(6000);
  });

  it("handles 0 savings target", () => {
    const result = generateProjectionData(0);
    expect(result.every((v) => v === 0)).toBe(true);
  });
});

describe("getGoalTimelineLabel", () => {
  it("estimates months to emergency fund (3× income, 20% savings)", () => {
    // income 3000, savings 600 → target 9000 → 15 months
    expect(getGoalTimelineLabel("save_emergency", 3000, 600)).toBe("~15 months");
  });

  it("returns fixed label for non-calculable goals", () => {
    expect(getGoalTimelineLabel("pay_debt", 3000, 600)).toBe("Coach-guided");
    expect(getGoalTimelineLabel("invest", 3000, 600)).toBe("Long-term");
    expect(getGoalTimelineLabel("budget_control", 3000, 600)).toBe("Daily habit");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd frontend && npx jest currency --no-coverage 2>&1 | head -20
```

Expected: FAIL.

- [ ] **Step 3: Implement currency utility**

```typescript
// frontend/src/utils/currency.ts
import cc from "currency-codes";

export const getAllCurrencies = (): { code: string; name: string }[] =>
  cc.codes().map((code) => ({ code, name: cc.code(code)!.currency }));

export const getCurrencySymbol = (code: string): string => {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
};

export const generateProjectionData = (monthlySavings: number): number[] =>
  Array.from({ length: 12 }, (_, i) => monthlySavings * (i + 1));

export const getGoalTimelineLabel = (
  goal: string,
  income: number,
  savings: number
): string => {
  if (goal === "save_emergency") {
    const target = income * 3;
    const months = savings > 0 ? Math.ceil(target / savings) : 0;
    return months > 0 ? `~${months} months` : "Set a savings target";
  }
  if (goal === "pay_debt") return "Coach-guided";
  if (goal === "invest") return "Long-term";
  return "Daily habit";
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd frontend && npx jest currency --no-coverage
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Create CurrencyPicker component**

```typescript
// frontend/src/components/common/CurrencyPicker.tsx
import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { getAllCurrencies, getCurrencySymbol } from "../../utils/currency";
import { useThemeStore } from "../../stores/themeStore";

interface Props {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export const CurrencyPicker = ({ visible, selectedCode, onSelect, onClose }: Props) => {
  const { isDark } = useThemeStore();
  const [query, setQuery] = useState("");

  const surface = isDark ? "#1E1E1E" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#1f2937";
  const textSecondary = isDark ? "#a3b2a4" : "#6b7280";
  const inputBg = isDark ? "#2C2C2C" : "#f3f4f6";

  const allCurrencies = useMemo(() => getAllCurrencies(), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return allCurrencies;
    return allCurrencies.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query, allCurrencies]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: surface }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: textPrimary }]}>Select Currency</Text>

          <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
            <Ionicons name="search" size={16} color={textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by code or name..."
              placeholderTextColor={textSecondary}
              style={[styles.searchInput, { color: textPrimary }]}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.row,
                  item.code === selectedCode && { backgroundColor: `${colors.primary}1A` },
                ]}
                onPress={() => { onSelect(item.code); onClose(); }}
              >
                <Text style={[styles.symbol, { color: colors.primary }]}>
                  {getCurrencySymbol(item.code)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.code, { color: textPrimary }]}>{item.code}</Text>
                  <Text style={[styles.name, { color: textSecondary }]}>{item.name}</Text>
                </View>
                {item.code === selectedCode && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, height: "80%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12, fontFamily: "RobotoMono-Bold" },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: "RobotoMono-Regular" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  symbol: { fontSize: 18, fontWeight: "700", width: 32, textAlign: "center" },
  code: { fontSize: 15, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  name: { fontSize: 12, fontFamily: "RobotoMono-Regular" },
});
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/currency.ts frontend/src/__tests__/currency.test.ts frontend/src/components/common/CurrencyPicker.tsx
git commit -m "feat: add currency utility, projection helpers, and CurrencyPicker component"
```

---

### Task 14: Reports API client

**Files:**
- Create: `frontend/src/api/reports.ts`

- [ ] **Step 1: Create the file**

```typescript
// frontend/src/api/reports.ts
import apiClient, { handleApiError } from "./client";
import { WeeklyReportSummary, WeeklyReportDetail } from "../types/report";

type ApiResponse<T> = { success: boolean; data?: T; message?: string };

export const getReports = async (): Promise<WeeklyReportSummary[]> => {
  try {
    const res = await apiClient.get<ApiResponse<WeeklyReportSummary[]>>("/user/reports");
    return res.data?.data ?? [];
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const getReportById = async (id: string): Promise<WeeklyReportDetail> => {
  try {
    const res = await apiClient.get<ApiResponse<WeeklyReportDetail>>(`/user/reports/${id}`);
    if (!res.data?.data) throw new Error("Report not found");
    return res.data.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/reports.ts
git commit -m "feat: add reports API client"
```

---

### Task 15: Push token registration in App.tsx

**Files:**
- Modify: `frontend/App.tsx`

- [ ] **Step 1: Add imports at the top of App.tsx**

```typescript
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import apiClient from "./src/api/client";
```

- [ ] **Step 2: Configure notification handler (before the App component)**

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

- [ ] **Step 3: Add `registerPushToken` function inside the App component, called when user is authenticated**

Add this effect inside the `App` component after the existing effects:

```typescript
useEffect(() => {
  if (!isAuthenticated) return;

  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      await apiClient.post("/user/push-token", { pushToken: tokenData.data });
    } catch (err) {
      // Non-critical — app works without push notifications
      console.warn("Push token registration failed:", err);
    }
  };

  registerPushToken();
}, [isAuthenticated]);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add frontend/App.tsx
git commit -m "feat: register Expo push token on authenticated app start"
```

---

## Phase 3 — Onboarding

### Task 16: OnboardingScreen — chat UI and question flow

**Files:**
- Create: `frontend/src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// frontend/src/screens/OnboardingScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, useThemedColors } from "../theme";
import { useUserStore } from "../stores/userStore";
import { useAlertStore } from "../stores/alertStore";
import * as userApi from "../api/user";
import { CurrencyPicker } from "../components/common/CurrencyPicker";
import {
  getCurrencySymbol,
  generateProjectionData,
  getGoalTimelineLabel,
} from "../utils/currency";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

type FinancialGoal = "save_emergency" | "pay_debt" | "invest" | "budget_control";
type RiskTolerance = "conservative" | "moderate" | "aggressive";

interface Answers {
  currency: string;
  income: number;
  savings: number;
  age: number;
  goal: FinancialGoal;
  risk: RiskTolerance;
  categories: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  isCoach: boolean;
  isAnalysis?: boolean;
}

const GOAL_OPTIONS = [
  { value: "save_emergency", label: "Emergency Fund", icon: "shield-checkmark" },
  { value: "pay_debt", label: "Pay Off Debt", icon: "trending-down" },
  { value: "invest", label: "Invest Wealth", icon: "trending-up" },
  { value: "budget_control", label: "Budget Control", icon: "wallet" },
] as const;

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", emoji: "🛡️" },
  { value: "moderate", label: "Moderate", emoji: "⚖️" },
  { value: "aggressive", label: "Aggressive", emoji: "🚀" },
] as const;

const CATEGORY_OPTIONS = ["Food", "Transport", "Health", "Shopping", "Bills", "Fun"];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const OnboardingScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { user, setUser } = useUserStore();
  const { showAlert } = useAlertStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = intro not shown yet
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [inputValue, setInputValue] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const addMessage = (text: string, isCoach: boolean, isAnalysis = false) => {
    const id = `msg-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id, text, isCoach, isAnalysis }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Show intro message on mount
  useEffect(() => {
    const firstName = user?.name?.split(" ")[0] ?? "there";
    setTimeout(() => {
      addMessage(
        `Hi ${firstName}! I'm your AI Finance Coach. Let's set up your profile so I can give you personalised advice. First — what currency do you use?`,
        true
      );
      setCurrentStep(0);
    }, 500);
  }, []);

  const getStepPrompt = (step: number, ans: Partial<Answers>): string => {
    const symbol = getCurrencySymbol(ans.currency ?? "USD");
    switch (step) {
      case 1: return `Great choice! What's your monthly income? (${symbol})`;
      case 2: return `How much do you want to save each month? (${symbol})`;
      case 3: return "How old are you?";
      case 4: return "What's your main financial goal right now?";
      case 5: return "How do you feel about financial risk?";
      case 6: return "Which categories do you usually spend on? (select all that apply)";
      default: return "";
    }
  };

  const advanceStep = (newAnswers: Partial<Answers>, userText: string) => {
    addMessage(userText, false);
    const nextStep = currentStep + 1;

    setTimeout(() => {
      if (nextStep <= 6) {
        addMessage(getStepPrompt(nextStep, newAnswers), true);
        setCurrentStep(nextStep);
        setInputValue("");
      } else {
        finishOnboarding(newAnswers as Answers);
      }
    }, 600);
  };

  const handleNumberInput = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val < 0) {
      showAlert("Invalid", "Please enter a valid number.");
      return;
    }
    const key = currentStep === 1 ? "income" : currentStep === 2 ? "savings" : "age";
    if (key === "age" && (val < 13 || val > 120)) {
      showAlert("Invalid", "Please enter an age between 13 and 120.");
      return;
    }
    const newAnswers = { ...answers, [key]: key === "age" ? Math.round(val) : val };
    setAnswers(newAnswers);
    advanceStep(newAnswers, inputValue);
  };

  const handleCurrencySelect = (code: string) => {
    const newAnswers = { ...answers, currency: code };
    setAnswers(newAnswers);
    advanceStep(newAnswers, code);
  };

  const handleGoalSelect = (goal: FinancialGoal, label: string) => {
    const newAnswers = { ...answers, goal };
    setAnswers(newAnswers);
    advanceStep(newAnswers, label);
  };

  const handleRiskSelect = (risk: RiskTolerance, label: string) => {
    const newAnswers = { ...answers, risk };
    setAnswers(newAnswers);
    advanceStep(newAnswers, label);
  };

  const handleCategoryToggle = (cat: string) => {
    const current = answers.categories ?? [];
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setAnswers((prev) => ({ ...prev, categories: next }));
  };

  const handleCategoriesDone = () => {
    const cats = answers.categories ?? [];
    if (cats.length === 0) {
      showAlert("Select at least one", "Pick at least one spending category.");
      return;
    }
    const newAnswers = { ...answers, categories: cats };
    setAnswers(newAnswers);
    advanceStep(newAnswers, cats.join(", "));
  };

  const finishOnboarding = async (finalAnswers: Answers) => {
    addMessage("Here's your personalised financial snapshot 👇", true);
    setTimeout(() => setShowAnalysis(true), 800);
    setCurrentStep(7);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const finalAnswers = answers as Answers;
      const updated = await userApi.updateProfile({
        profile: {
          monthlyIncome: finalAnswers.income,
          age: finalAnswers.age,
          primaryGoal: finalAnswers.goal,
          riskTolerance: finalAnswers.risk,
          spendingCategories: finalAnswers.categories,
          monthlySavingsTarget: finalAnswers.savings,
        },
        userPrefs: { currency: finalAnswers.currency },
        hasCompletedOnboarding: true,
      } as any);
      setUser(updated);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch {
      showAlert("Error", "Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = () => {
    if (currentStep === 0) {
      return (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <Text style={styles.primaryBtnText}>Choose Currency</Text>
        </TouchableOpacity>
      );
    }
    if (currentStep >= 1 && currentStep <= 3) {
      return (
        <View style={styles.inputRow}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder={currentStep === 3 ? "Your age" : "Enter amount"}
            placeholderTextColor={themedColors.textSecondary}
            style={[styles.textInput, { color: themedColors.textPrimary, borderColor: colors.primary, backgroundColor: themedColors.surface }]}
            returnKeyType="done"
            onSubmitEditing={handleNumberInput}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleNumberInput}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    if (currentStep === 4) {
      return (
        <View style={styles.chipsGrid}>
          {GOAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, { backgroundColor: themedColors.surface, borderColor: themedColors.border }]}
              onPress={() => handleGoalSelect(opt.value, opt.label)}
            >
              <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.chipText, { color: themedColors.textPrimary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (currentStep === 5) {
      return (
        <View style={styles.chipsRow}>
          {RISK_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, { backgroundColor: themedColors.surface, borderColor: themedColors.border, flex: 1 }]}
              onPress={() => handleRiskSelect(opt.value, opt.label)}
            >
              <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
              <Text style={[styles.chipText, { color: themedColors.textPrimary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (currentStep === 6) {
      const selected = answers.categories ?? [];
      return (
        <View>
          <View style={styles.chipsWrap}>
            {CATEGORY_OPTIONS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  { backgroundColor: themedColors.surface, borderColor: themedColors.border },
                  selected.includes(cat) && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => handleCategoryToggle(cat)}
              >
                <Text style={[styles.chipText, { color: selected.includes(cat) ? "#fff" : themedColors.textPrimary }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
            onPress={handleCategoriesDone}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderAnalysisCard = () => {
    if (!showAnalysis) return null;
    const a = answers as Answers;
    const symbol = getCurrencySymbol(a.currency);
    const projData = generateProjectionData(a.savings);
    const dailyBudget = Math.round(a.income / 30);
    const timeline = getGoalTimelineLabel(a.goal, a.income, a.savings);
    const riskColors: Record<string, string> = {
      conservative: "#10b981",
      moderate: colors.primary,
      aggressive: "#ef4444",
    };

    const coachMsg = `Based on your income, you can save ${symbol}${(a.savings * 12).toLocaleString()} this year. ${
      timeline.startsWith("~")
        ? `At this rate you'll reach your goal in ${timeline} — let's make it happen!`
        : `Your coach will help you map the path — let's get started!`
    }`;

    return (
      <View style={[styles.analysisCard, { backgroundColor: themedColors.surface }]}>
        <Text style={[styles.analysisTitle, { color: themedColors.textPrimary }]}>
          Your 12-Month Savings Projection
        </Text>
        <LineChart
          data={{ labels: MONTH_LABELS, datasets: [{ data: projData }] }}
          width={SCREEN_WIDTH - 80}
          height={160}
          chartConfig={{
            backgroundGradientFrom: themedColors.surface,
            backgroundGradientTo: themedColors.surface,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => themedColors.textSecondary,
            propsForDots: { r: "3", strokeWidth: "2", stroke: colors.primary },
          }}
          bezier
          style={{ borderRadius: 12, marginVertical: 8 }}
        />

        <View style={styles.statRow}>
          {[
            { emoji: "💰", label: "Daily Budget", value: `${symbol}${dailyBudget}` },
            { emoji: "🎯", label: "Goal Timeline", value: timeline },
            { emoji: "📊", label: "Risk Profile", value: a.risk.charAt(0).toUpperCase() + a.risk.slice(1) },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: themedColors.background }]}>
              <Text style={{ fontSize: 20 }}>{stat.emoji}</Text>
              <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.coachMsg, { color: themedColors.textSecondary }]}>{coachMsg}</Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
          onPress={handleComplete}
          disabled={isSaving}
        >
          <Text style={styles.primaryBtnText}>{isSaving ? "Setting up..." : "Let's Start 🚀"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themedColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={18} color="#fff" />
        </View>
        <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>AI Finance Coach</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.bubbleRow, msg.isCoach ? styles.coachRow : styles.userRow]}>
            {msg.isCoach && (
              <View style={[styles.miniAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={10} color="#fff" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.isCoach
                  ? [styles.coachBubble, { backgroundColor: themedColors.surface }]
                  : [styles.userBubble, { backgroundColor: colors.primary }],
              ]}
            >
              <Text style={[styles.bubbleText, { color: msg.isCoach ? themedColors.textPrimary : "#fff" }]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {showAnalysis && renderAnalysisCard()}

        <View style={{ height: 20 }} />
      </ScrollView>

      {currentStep >= 0 && currentStep <= 6 && (
        <View style={[styles.inputArea, { borderTopColor: themedColors.border, backgroundColor: themedColors.background }]}>
          {renderInput()}
        </View>
      )}

      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={answers.currency ?? "USD"}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, gap: 10 },
  avatarDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  scrollContent: { padding: 16, paddingBottom: 8 },
  bubbleRow: { flexDirection: "row", marginBottom: 12, gap: 8 },
  coachRow: { alignItems: "flex-end" },
  userRow: { flexDirection: "row-reverse" },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  coachBubble: { borderTopLeftRadius: 4 },
  userBubble: { borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, fontFamily: "RobotoMono-Regular" },
  inputArea: { padding: 16, borderTopWidth: 1 },
  inputRow: { flexDirection: "row", gap: 8 },
  textInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontFamily: "RobotoMono-Regular" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  primaryBtn: { borderRadius: 30, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "RobotoMono-Bold" },
  chipsGrid: { gap: 8 },
  chipsRow: { flexDirection: "row", gap: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: "center", gap: 6 },
  chipText: { fontSize: 13, fontWeight: "600", fontFamily: "RobotoMono-Bold" },
  analysisCard: { borderRadius: 20, padding: 16, marginTop: 8 },
  analysisTitle: { fontSize: 16, fontWeight: "700", fontFamily: "RobotoMono-Bold", marginBottom: 4 },
  statRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", fontFamily: "RobotoMono-Regular" },
  statValue: { fontSize: 13, fontWeight: "700", textAlign: "center", fontFamily: "RobotoMono-Bold" },
  coachMsg: { fontSize: 13, lineHeight: 20, marginTop: 12, fontFamily: "RobotoMono-Regular" },
});

export default OnboardingScreen;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/screens/OnboardingScreen.tsx
git commit -m "feat: add conversational OnboardingScreen with chat UI and analysis card"
```

---

### Task 17: Wire onboarding into AppNavigator

**Files:**
- Modify: `frontend/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Import OnboardingScreen and WeeklyReportScreen**

```typescript
import OnboardingScreen from "../screens/OnboardingScreen";
import WeeklyReportScreen from "../screens/WeeklyReportScreen"; // created in Task 18
```

- [ ] **Step 2: Update `RootNavigator` to show Onboarding when `!hasCompletedOnboarding`**

Replace the authenticated routes block:

```typescript
{isAuthenticated ? (
  user?.hasCompletedOnboarding === false ? (
    <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
  ) : (
    <>
      <RootStack.Screen name="Main" component={MainTabNavigator} />
      <RootStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <RootStack.Screen name="LogTransaction" component={LogTransactionScreen} options={{ presentation: "modal" }} />
      <RootStack.Screen name="AllTransactions" component={AllTransactionsScreen} />
      <RootStack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ presentation: "modal" }} />
      <RootStack.Screen name="ChatInterface" component={ChatInterfaceScreen} />
      <RootStack.Screen name="WeeklyReport" component={WeeklyReportScreen} />
    </>
  )
) : (
  <RootStack.Screen name="Auth" component={AuthNavigator} />
)}
```

- [ ] **Step 3: Add notification deep-link listener in App.tsx**

In `frontend/App.tsx`, add after the push token effect:

```typescript
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    if (data?.screen === "WeeklyReport" && data?.reportId) {
      // Use a ref or navigation ref — simplest: store pending nav in a module-level variable
      // For now, navigate when app is open; deep-link from background is handled by the OS
    }
  });
  return () => sub.remove();
}, []);
```

> **Note:** Full background deep-linking requires `expo-linking` or a navigation ref. This listener handles the foreground case. The OS handles launching the app to the correct screen when tapped from background using the `data` payload — this works automatically with Expo Go for development.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/navigation/AppNavigator.tsx frontend/App.tsx
git commit -m "feat: gate Main on hasCompletedOnboarding, add WeeklyReport screen to navigator"
```

---

## Phase 4 — Weekly Report Screen

### Task 18: WeeklyReportScreen

**Files:**
- Create: `frontend/src/screens/WeeklyReportScreen.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// frontend/src/screens/WeeklyReportScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { colors, spacing, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { BackButton } from "../components/common/BackButton";
import * as reportsApi from "../api/reports";
import { WeeklyReportDetail } from "../types/report";
import { useUserStore } from "../stores/userStore";
import { getCurrencySymbol } from "../utils/currency";

const WeeklyReportScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { reportId } = route.params as { reportId: string };
  const { user } = useUserStore();

  const [report, setReport] = useState<WeeklyReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const symbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");

  useEffect(() => {
    reportsApi.getReportById(reportId)
      .then(setReport)
      .catch(() => navigation.goBack())
      .finally(() => setIsLoading(false));
  }, [reportId]);

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const html = `
        <html><body style="font-family:sans-serif;padding:24px;max-width:600px;margin:auto">
          <h1 style="color:#2D9CDB">AI Finance Coach</h1>
          <h2>Weekly Report</h2>
          <p style="color:#888">${formatDateRange(report.weekStart, report.weekEnd)}</p>
          <hr/>
          <h3>Summary</h3>
          <ul>
            <li><strong>Total Spent:</strong> ${symbol}${report.totalSpent.toFixed(2)}</li>
            <li><strong>Transactions:</strong> ${report.txCount}</li>
            <li><strong>Top Category:</strong> ${report.topCategory}</li>
          </ul>
          <h3>Coach's Notes</h3>
          <p>${report.aiSummary}</p>
          <p style="color:#aaa;font-size:12px;margin-top:40px">Generated by AI Finance Coach</p>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    } catch {
      // sharing cancelled or failed — no alert needed
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer backgroundColor={themedColors.background}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </ScreenContainer>
    );
  }

  if (!report) return null;

  return (
    <ScreenContainer backgroundColor={themedColors.background}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <BackButton />
        <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]}>Weekly Report</Text>
        <TouchableOpacity onPress={handleExportPdf} disabled={isExporting} style={styles.exportBtn}>
          {isExporting
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="download-outline" size={24} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.dateRange, { color: themedColors.textSecondary }]}>
          {formatDateRange(report.weekStart, report.weekEnd)}
        </Text>

        <View style={styles.statsRow}>
          {[
            { label: "Total Spent", value: `${symbol}${report.totalSpent.toFixed(2)}`, color: colors.error },
            { label: "Transactions", value: String(report.txCount), color: colors.primary },
            { label: "Top Category", value: report.topCategory, color: colors.accent },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: themedColors.surface }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: themedColors.surface }]}>
          <View style={styles.coachHeader}>
            <View style={[styles.coachDot, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={14} color="#fff" />
            </View>
            <Text style={[styles.coachName, { color: colors.primary }]}>Coach's Notes</Text>
          </View>
          <Text style={[styles.summaryText, { color: themedColors.textPrimary }]}>
            {report.aiSummary}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.downloadBtn, { borderColor: colors.primary }]}
          onPress={handleExportPdf}
          disabled={isExporting}
        >
          <Ionicons name="document-outline" size={18} color={colors.primary} />
          <Text style={[styles.downloadBtnText, { color: colors.primary }]}>
            {isExporting ? "Exporting..." : "Download PDF"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  exportBtn: { width: 40, alignItems: "flex-end" },
  content: { padding: 16 },
  dateRange: { fontSize: 14, marginBottom: 16, fontFamily: "RobotoMono-Regular" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 15, fontWeight: "700", fontFamily: "RobotoMono-Bold", textAlign: "center" },
  statLabel: { fontSize: 10, textTransform: "uppercase", fontFamily: "RobotoMono-Regular" },
  summaryCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  coachHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  coachDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  coachName: { fontSize: 14, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  summaryText: { fontSize: 14, lineHeight: 22, fontFamily: "RobotoMono-Regular" },
  downloadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderRadius: 30, paddingVertical: 14 },
  downloadBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
});

export default WeeklyReportScreen;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/screens/WeeklyReportScreen.tsx
git commit -m "feat: add WeeklyReportScreen with stats, coach summary, and PDF export"
```

---

### Task 19: Profile screen — Past Reports section

**Files:**
- Modify: `frontend/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add imports**

At the top of `ProfileScreen.tsx`, add:

```typescript
import { useNavigation } from "@react-navigation/native";
import * as reportsApi from "../api/reports";
import { WeeklyReportSummary } from "../types/report";
import { getCurrencySymbol } from "../utils/currency";
```

- [ ] **Step 2: Add state and data-fetch inside the component**

```typescript
const navigation = useNavigation<any>();
const [reports, setReports] = useState<WeeklyReportSummary[]>([]);

useEffect(() => {
  reportsApi.getReports().then(setReports).catch(() => {});
}, []);

const symbol = getCurrencySymbol(user?.userPrefs?.currency ?? "USD");
```

- [ ] **Step 3: Add Past Reports section before the bottom spacer `<View style={{ height: 100 }} />`**

```tsx
<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>
    Past Reports
  </Text>
  {reports.length === 0 ? (
    <Text style={[{ color: themedColors.textSecondary, fontSize: 14, paddingLeft: 4 }]}>
      Your weekly reports will appear here.
    </Text>
  ) : (
    <View style={[styles.preferencesContainer, { backgroundColor: themedColors.surface, padding: 0 }]}>
      {reports.map((r, i) => {
        const start = new Date(r.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const end = new Date(r.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <TouchableOpacity
            key={r._id}
            style={[
              styles.reportRow,
              { borderBottomColor: themedColors.border },
              i === reports.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => navigation.navigate("WeeklyReport", { reportId: r._id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.reportDate, { color: themedColors.textPrimary }]}>
                {start} – {end}
              </Text>
              <Text style={[styles.reportMeta, { color: themedColors.textSecondary }]}>
                {r.txCount} transactions · {symbol}{r.totalSpent.toFixed(2)} spent
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
          </TouchableOpacity>
        );
      })}
    </View>
  )}
</View>
```

- [ ] **Step 4: Add the new styles**

```typescript
reportRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
  borderBottomWidth: 1,
},
reportDate: {
  fontSize: 14,
  fontWeight: "700",
  fontFamily: typography.fontFamily.display,
  marginBottom: 2,
},
reportMeta: {
  fontSize: 12,
  fontFamily: typography.fontFamily.body,
},
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/ProfileScreen.tsx
git commit -m "feat: add Past Reports section to ProfileScreen"
```

---

## Phase 5 — Settings Screen

### Task 20: Settings screen — wire prefs and currency picker

**Files:**
- Modify: `frontend/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useUserStore } from "../stores/userStore";
import * as userApi from "../api/user";
import { CurrencyPicker } from "../components/common/CurrencyPicker";
import { getCurrencySymbol } from "../utils/currency";
```

- [ ] **Step 2: Add store access and currency picker state inside the component**

Replace the existing local state declarations for `spendingAlerts`, `budgetCheckins`, `weeklyReport`, and `currency`:

```typescript
const { user, setUser } = useUserStore();
const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

const spendingAlerts = user?.userPrefs?.spendingAlerts ?? true;
const weeklyReport   = user?.userPrefs?.weeklyReport   ?? true;
const checkIn        = user?.userPrefs?.checkIn        ?? true;
const currency       = user?.userPrefs?.currency       ?? "USD";

const updatePref = async (key: string, value: boolean | string) => {
  try {
    const updated = await userApi.updateProfile({ userPrefs: { [key]: value } } as any);
    setUser(updated);
  } catch {
    showAlert("Error", "Failed to save preference.");
  }
};
```

- [ ] **Step 3: Wire the existing toggle `onValueChange` handlers**

Find the three `Switch` components in the JSX. Update their `value` and `onValueChange` props:

For Spending Alerts:
```tsx
value={spendingAlerts}
onValueChange={(v) => updatePref("spendingAlerts", v)}
```

For Weekly Report:
```tsx
value={weeklyReport}
onValueChange={(v) => updatePref("weeklyReport", v)}
```

For Check-ins (currently `budgetCheckins`):
```tsx
value={checkIn}
onValueChange={(v) => updatePref("checkIn", v)}
```

- [ ] **Step 4: Wire the currency row to open the picker**

Find the currency display row in the Settings JSX. Replace its `onPress` (or add one) to open the picker, and show the current currency code + symbol:

```tsx
// The currency row — update the label text and onPress:
onPress={() => setShowCurrencyPicker(true)}
// Label text:
`${currency} — ${getCurrencySymbol(currency)}`
```

- [ ] **Step 5: Add CurrencyPicker to the JSX (before the closing tag of ScreenContainer)**

```tsx
<CurrencyPicker
  visible={showCurrencyPicker}
  selectedCode={currency}
  onSelect={(code) => updatePref("currency", code)}
  onClose={() => setShowCurrencyPicker(false)}
/>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/screens/SettingsScreen.tsx
git commit -m "feat: wire Settings toggles and currency picker to backend userPrefs"
```

---

## Final Verification

- [ ] **Start backend and confirm cron logs appear**

```bash
cd backend && npm run dev
# Expected: "✅ Cron jobs registered: weekly reports (Sun 8pm), daily check-ins (8am)"
```

- [ ] **Start frontend and verify onboarding shows for new users**

```bash
cd frontend && npx expo start
# Log in with a new account → OnboardingScreen should appear
# Log in with an existing account that has hasCompletedOnboarding=true → Main tab appears
```

- [ ] **Test spending alert manually**

Add a transaction that exceeds 80% of the user's daily budget. Confirm `checkAndSendSpendingAlert` is called (add a `console.log` temporarily) and the Expo Push API call is made.

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: complete onboarding, push notifications, and settings implementation"
```
