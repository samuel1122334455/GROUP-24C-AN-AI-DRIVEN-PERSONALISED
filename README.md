# Thrive — AI Financial Behavioral Coach

A **production-ready MVP** of an AI-powered financial behavioral coaching app built with React Native (Expo) and Node.js. Thrive helps users understand the *why* behind their spending, not just the *what*.

## Product Overview

**App Type:** Mobile AI Financial Behavioral Coach
**Platform:** React Native (Expo) — Android-first
**Design Philosophy:** Pixel-perfect UI with a centralized theme system

### Core Concept

Financial health is treated with the same rigor as physical health. Instead of tracking calories, users track spending. Instead of identifying food triggers, users identify emotional spending triggers. The AI coach uses behavioral finance principles to help users align their spending with their long-term goals.

### Available Screens

1. **Landing** — Welcome screen with sign in / sign up entry points
2. **Onboarding** — 7-step conversational financial profiling (income, goals, risk tolerance)
3. **Dashboard** — Daily spending vs. budget with emotional buy count and recent transactions
4. **Log Transaction** — Expense entry with amount, category, mood, and trigger selectors
5. **Scan Receipt** — AI vision-powered receipt parsing via camera or gallery
6. **Financial Coach Chat** — Multi-turn AI behavioral coaching with streaming responses
7. **Chat History** — Browse and resume past coaching conversations
8. **All Transactions** — Full transaction history with filtering
9. **Transaction Detail** — Single transaction view with mood/trigger context
10. **Profile & Goals** — Edit income, savings target, risk tolerance, spending categories
11. **Weekly Report** — AI-generated weekly spending summary with PDF export
12. **Notifications** — In-app notification center (spending alerts, weekly reports, check-ins)
13. **Notification Detail** — Individual notification view
14. **Settings** — Notification preferences, currency picker, account management

---

## Tech Stack

### Frontend

- **React Native** (Expo) — Cross-platform mobile framework
- **React Navigation** — Screen navigation with bottom tabs
- **Zustand** — Lightweight state management
- **Axios** — HTTP client for API calls
- **expo-secure-store** — Secure JWT token storage
- **expo-camera / expo-image-picker** — Receipt scanning
- **expo-notifications** — Push notification handling
- **expo-print / expo-sharing** — PDF report export

### Backend

- **Node.js** + **Express** — REST API server
- **MongoDB** (Mongoose) — NoSQL database
- **JWT** — Access & refresh token authentication
- **bcrypt** — Password hashing
- **node-cron** — Scheduled jobs (weekly reports, daily check-ins)
- **helmet + express-rate-limit** — Security hardening

### AI Provider (Configurable)

- **OpenAI API** (GPT-4o with vision)
- **Google Gemini API** (Gemini 2.5 Flash with vision)

Switch providers via a single environment variable. Both support text chat, streaming, and image-based receipt parsing.

---

## Design System

### Color Palette

```
Primary:   #2D9CDB  (blue — trust & stability)
Accent:    #F2C94C  (gold — wealth & progress)
Success:   #27AE60  (green — savings & gains)
Warning:   #EB5757  (red — overspending)
```

### Theme Structure

All theme values are centralized in `frontend/src/theme/`:

```
frontend/src/theme/
├── colors.ts        # Color palette + dark mode variants
├── typography.ts    # Font families & sizes
├── spacing.ts       # Spacing scale (xs → xl)
├── radius.ts        # Border radius values
└── index.ts         # Main theme export + useThemedColors hook
```

Dark mode is the default and fully supported throughout the app.

---

## Data Models

### User

```typescript
{
  email: string,
  password: string,          // bcrypt hashed
  name: string,
  age: number,
  monthlyIncome: number,
  monthlySavingsTarget: number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive',
  primaryGoal: 'save_emergency' | 'pay_debt' | 'invest' | 'budget_control',
  spendingCategories: string[],
  hasCompletedOnboarding: boolean,
  pushToken: string,
  userPrefs: {
    spendingAlerts: boolean,
    weeklyReport: boolean,
    checkIn: boolean,
    currency: string,
  }
}
```

### Transaction

```typescript
{
  userId: ObjectId,
  description: string,
  amount: number,
  category: 'essentials' | 'lifestyle' | 'impulse' | 'savings',
  mood: 'stressed' | 'happy' | 'neutral' | 'bored' | 'anxious',
  trigger: 'peer_pressure' | 'stress' | 'celebration' | 'habit' | 'none',
  notes: string,
  date: Date,
}
```

### Daily Spending Summary

```typescript
{
  date: string,
  totalSpent: number,
  budgetLimit: number,        // derived from monthlyIncome
  emotionalSpendingCount: number,
  topTrigger: string,
  savingsProgress: number,
  transactions: Transaction[],
}
```

---

## Folder Structure

```
ai-finance-coach/
├── README.md
├── .gitignore
├── Pivot_Prompt_Financial_Coach.md
├── frontend/
│   ├── app.json
│   ├── package.json
│   ├── App.tsx
│   └── src/
│       ├── theme/
│       │   ├── colors.ts
│       │   ├── typography.ts
│       │   ├── spacing.ts
│       │   ├── radius.ts
│       │   └── index.ts
│       ├── navigation/
│       │   ├── AppNavigator.tsx
│       │   ├── AuthNavigator.tsx
│       │   └── types.ts
│       ├── screens/
│       │   ├── LandingScreen.tsx
│       │   ├── LoginScreen.tsx
│       │   ├── SignUpScreen.tsx
│       │   ├── OnboardingScreen.tsx
│       │   ├── DashboardScreen.tsx
│       │   ├── LogTransactionScreen.tsx
│       │   ├── ScanReceiptScreen.tsx
│       │   ├── ChatInterfaceScreen.tsx
│       │   ├── ChatHistoryScreen.tsx
│       │   ├── AllTransactionsScreen.tsx
│       │   ├── TransactionDetailScreen.tsx
│       │   ├── ProfileScreen.tsx
│       │   ├── WeeklyReportScreen.tsx
│       │   ├── NotificationsScreen.tsx
│       │   ├── NotificationDetailScreen.tsx
│       │   └── SettingsScreen.tsx
│       ├── components/
│       │   └── common/
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── AppAlertModal.tsx
│       │       ├── CurrencyPicker.tsx
│       │       └── TypingIndicator.tsx
│       ├── stores/
│       │   ├── authStore.ts
│       │   ├── userStore.ts
│       │   ├── transactionStore.ts
│       │   ├── chatStore.ts
│       │   ├── notificationStore.ts
│       │   ├── alertStore.ts
│       │   └── themeStore.ts
│       ├── api/
│       │   ├── client.ts
│       │   ├── auth.ts
│       │   ├── transactions.ts
│       │   ├── chat.ts
│       │   ├── user.ts
│       │   ├── notifications.ts
│       │   └── reports.ts
│       ├── utils/
│       │   └── currency.ts
│       └── types/
│           ├── user.ts
│           ├── transaction.ts
│           ├── chat.ts
│           ├── notification.ts
│           └── report.ts
└── backend/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── server.ts
        ├── app.ts
        ├── routes/
        │   ├── auth.routes.ts
        │   ├── user.routes.ts
        │   ├── chat.routes.ts
        │   ├── transaction.routes.ts
        │   └── notification.routes.ts
        ├── controllers/
        │   ├── auth.controller.ts
        │   ├── user.controller.ts
        │   ├── chat.controller.ts
        │   ├── transaction.controller.ts
        │   └── notification.controller.ts
        ├── models/
        │   ├── User.model.ts
        │   ├── Chat.model.ts
        │   ├── Transaction.model.ts
        │   ├── Notification.model.ts
        │   └── WeeklyReport.model.ts
        ├── middleware/
        │   ├── auth.middleware.ts
        │   └── error.middleware.ts
        ├── services/
        │   ├── notification.service.ts
        │   ├── cron.service.ts
        │   └── ai/
        │       ├── provider.interface.ts
        │       ├── openai.service.ts
        │       ├── gemini.service.ts
        │       └── aiService.ts
        └── config/
            ├── database.ts
            └── environment.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- **Expo CLI** (`npm install -g expo-cli`)
- API key for **OpenAI** or **Google Gemini**
- (Optional) **Expo Push Token** for push notifications

### Installation

#### 1. Clone and Install

```bash
cd ai-finance-coach

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

**Backend** (`backend/.env`):

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-finance-coach

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI Provider (openai | gemini)
AI_PROVIDER=gemini
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash

# Financial Defaults
DAILY_BUDGET_DEFAULT=100
EMERGENCY_FUND_MONTHS=3
```

**Frontend** (`frontend/.env`):

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

#### 3. Start MongoDB

```bash
mongod
```

#### 4. Run the Backend

```bash
cd backend
npm run dev
```

API starts on `http://localhost:5000`

#### 5. Run the Frontend

```bash
cd frontend
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create account |
| POST | `/login` | Login, returns tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user transactions |
| POST | `/log` | Log a new transaction |
| GET | `/:id` | Get transaction by ID |
| DELETE | `/:id` | Delete transaction |
| POST | `/parse-receipt` | AI receipt parsing (image upload) |

### User (`/api/user`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| GET | `/spending-summary` | Daily spending vs. budget |
| GET | `/reports` | List weekly reports |
| GET | `/reports/:id` | Get specific weekly report |
| POST | `/push-token` | Save Expo push token |
| DELETE | `/account` | Delete account and all data |

### Chat (`/api/chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List all conversations |
| POST | `/conversations` | Start new conversation |
| GET | `/conversation/:id` | Get conversation with messages |
| DELETE | `/conversation/:id` | Delete conversation |
| POST | `/message` | Send message (standard) |
| POST | `/message-stream` | Send message (SSE streaming) |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications |
| GET | `/:id` | Get notification |
| PATCH | `/:id/read` | Mark as read |
| PATCH | `/read-all` | Mark all as read |

---

## Switching AI Providers

1. Open `backend/.env`
2. Set `AI_PROVIDER` to `openai` or `gemini`
3. Ensure the corresponding API key is set
4. Restart the backend

Both providers support text chat, streaming responses, and image-based receipt parsing.

---

## AI Behavior & Safety

### Coach Personality

The AI acts as a **compassionate, non-judgmental financial behavioral coach**:

- Analyzes the emotional and psychological reasons behind spending
- Uses behavioral finance principles (loss aversion, present bias, mental accounting)
- Provides actionable strategies to align spending with long-term goals
- Asks reflective questions to build self-awareness
- Celebrates financial wins — money shame is counterproductive

### Safety Rules

**The AI CAN:**
- Analyze spending patterns and identify emotional triggers
- Suggest budgeting frameworks (50/30/20, zero-based, envelope method)
- Provide general debt reduction strategies
- Offer behavioral techniques (delay gratification, mindful spending)

**The AI CANNOT:**
- Provide specific investment recommendations
- Give tax advice or legal counsel
- Recommend individual stocks, crypto, or funds
- Make market performance predictions
- Access or modify actual bank accounts

**Mandatory disclosures** are triggered for investment questions, tax questions, and complex debt situations — directing users to certified professionals.

---

## Features

### Authentication
- Email/password registration and login
- JWT access & refresh token system
- Secure token storage with expo-secure-store
- Automatic token refresh on expiry

### Behavioral Transaction Logging
- Amount, description, and category entry
- Mood selector (stressed, happy, neutral, bored, anxious)
- Trigger selector (stress, habit, celebration, peer pressure)
- Optional reflection notes

### AI Receipt Scanning
- Camera or gallery image input
- AI vision extracts merchant, amount, and category
- Editable review before saving

### Spending Dashboard
- Daily spending vs. budget progress bar
- Emotional buy count for the day
- Top spending trigger
- Recent transaction list with quick actions

### Financial Coach Chat
- Multi-turn conversation with full history
- Streaming responses with typing indicator
- User financial context injected into every session
- Persistent conversations across sessions

### Notifications
- **Spending alert at 80%** of daily budget
- **Spending alert at 100%** of daily budget
- **Weekly report** delivered Sunday with AI summary
- **Daily check-in** if no transactions logged by morning
- In-app notification center with read/unread state
- Push notifications via Expo Push API

### Weekly Reports
- Total spent, top category, transaction count
- AI-generated behavioral coaching summary
- PDF export and share

### Profile & Goals
- Monthly income and savings target
- Primary goal (emergency fund, debt payoff, invest, budget control)
- Risk tolerance level
- Spending category preferences
- Past weekly reports accessible inline

### Settings
- Per-notification-type toggles (spending alerts, weekly report, check-in)
- Currency selector (symbols applied globally)
- Account deletion with full data purge

---

## Scheduled Jobs (Cron)

| Job | Schedule | Action |
|-----|----------|--------|
| Weekly Report | Sunday midnight | Generate AI report + push notification for all users |
| Daily Check-In | Daily 8:00 AM | Send check-in push if no transactions logged today |

---

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT stored in expo-secure-store (not AsyncStorage)
- Refresh token rotation on use
- Rate limiting on all routes (stricter on `/auth`)
- Helmet middleware for HTTP security headers
- Environment variables for all secrets
- No real banking API integration — behavioral tracking only

---

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend (EAS Build)

```bash
cd frontend
eas build --platform android
eas build --platform ios
```

---

## Troubleshooting

### Backend won't start
- Confirm MongoDB is running and `MONGODB_URI` is correct
- Check that port 5000 is not in use
- Verify `.env` file exists with all required keys

### Frontend can't connect to API
- For Android emulator: use `http://10.0.2.2:5000/api`
- For iOS simulator: use `http://localhost:5000/api`
- For physical device: use your machine's local IP address

### AI responses not working
- Confirm `AI_PROVIDER` is set to `openai` or `gemini`
- Verify the API key for the active provider
- Check backend logs for model/quota errors

### Receipt scanning fails
- Confirm the selected AI provider supports vision (both OpenAI and Gemini do)
- Check image file size (compress if > 5MB)

---

## Architecture Decisions

**Zustand over Redux** — minimal boilerplate, excellent TypeScript support, sufficient for MVP scope.

**Expo over React Native CLI** — faster setup, built-in secure storage, EAS build pipeline.

**MongoDB over PostgreSQL** — flexible schema suits behavioral data iteration; JSON-native for chat history.

**JWT over sessions** — stateless, mobile-friendly, scales well; refresh token pattern balances security with UX.

**Provider abstraction for AI** — OpenAI and Gemini behind a single interface allows zero-code provider switching and cost optimization.

---

## Future Enhancements

- Savings goal progress tracking with projections
- Recurring expense detection and alerts
- Spending trend charts (weekly/monthly)
- Bank statement import (CSV/PDF parsing)
- Multi-currency support with live exchange rates
- Shared budgets for households
- Apple/Google Pay transaction capture
- Gamification (streaks, badges for spending goals)

---

## References

- Thaler, R. H., & Sunstein, C. R. (2008). *Nudge*. Yale University Press.
- Kahneman, D., & Tversky, A. (1979). Prospect Theory. *Econometrica, 47*(2).
- Ariely, D. (2008). *Predictably Irrational*. HarperCollins.

---

## License

MIT License — See LICENSE file for details.

---

**Built with a design-strict, minimal, and teachable approach. Financial health starts with understanding yourself.**
