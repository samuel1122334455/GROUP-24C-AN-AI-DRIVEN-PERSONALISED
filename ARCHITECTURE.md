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
POST   /api/auth/register          Create account
POST   /api/auth/login             Login
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/logout            Invalidate refresh token

GET    /api/user/profile           Get own profile
PUT    /api/user/profile           Update profile fields
GET    /api/user/spending-summary  Daily spending totals, budget, emotional count
DELETE /api/user/account           Delete account + all data

GET    /api/transactions           List transactions (optional ?date= filter)
POST   /api/transactions           Log a transaction
GET    /api/transactions/:id       Get single transaction
DELETE /api/transactions/:id       Delete transaction

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
