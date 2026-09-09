# PIVOT PROMPT — AI Financial Behavioral Coach

## Transform AI Diet Consultant → AI Financial Behavioral Coach

---

## 🎯 PIVOT OVERVIEW

You are pivoting an **existing AI Diet Consultant app** into an **AI Financial Behavioral Coach** app. The core technical architecture, UI patterns, and development approach **remain identical**. Only the domain, data models, and AI personality change.

### Core Principle

**Financial health is treated with the same rigor as physical health.** Instead of tracking calories and macros, users track spending and savings. Instead of identifying food triggers, users identify emotional spending triggers.

---

## 📊 CONCEPTUAL MAPPING (Old → New)

| **Nutrition App**                           | **Financial App**                                 |
| ------------------------------------------- | ------------------------------------------------- |
| Calories & Macros                           | Spending & Savings                                |
| Meal Logging                                | Transaction/Expense Logging                       |
| Food Diary                                  | Financial Journal                                 |
| Nutrition Goals (lose/maintain/gain weight) | Financial Goals (save/budget/invest)              |
| Dietary Preferences (vegan, keto, etc.)     | Spending Categories (essentials, lifestyle, etc.) |
| Activity Level                              | Income Level / Risk Tolerance                     |
| Meal Detail View                            | Transaction Detail View                           |
| Daily Calorie Dashboard                     | Daily Spending Dashboard                          |
| Nutrition Expert AI                         | Financial Behavioral Coach AI                     |
| Recipe Database                             | Savings Tips / Financial Strategies               |

---

## 🏗️ WHAT STAYS THE SAME (No Changes Required)

### Technical Stack

- ✅ React Native (Expo)
- ✅ React Navigation
- ✅ Zustand (state management)
- ✅ Axios + expo-secure-store
- ✅ Node.js + Express + MongoDB
- ✅ JWT authentication (access + refresh)
- ✅ AI Provider abstraction (OpenAI/Gemini via env variable)

### Architecture

- ✅ 5-screen app structure
- ✅ Global theme system (colors, typography, spacing)
- ✅ Server-side AI Agent with chat history
- ✅ Dashboard with daily calculations
- ✅ Detail view for items
- ✅ Profile & goals management
- ✅ Settings screen

### Development Principles

- ✅ Design-first approach (pixel-perfect UI)
- ✅ No inline styles (theme tokens only)
- ✅ Minimal, clean codebase
- ✅ Security-first (JWT, bcrypt, no exposed keys)

---

## 🔄 WHAT CHANGES (Domain Pivot)

### 1. Screen Names & Purpose

| **Old Screen**       | **New Screen**            | **Purpose**                                      |
| -------------------- | ------------------------- | ------------------------------------------------ |
| AI Chat / Consult    | Financial Coach Chat      | AI-powered behavioral finance guidance           |
| Dashboard / Home     | Spending Dashboard        | Daily spending vs. budget + emotional trends     |
| Meal / Recipe Detail | Transaction Detail        | Breakdown of a single purchase with mood context |
| Profile & Goals      | Financial Profile & Goals | Income, savings goals, risk tolerance            |
| Settings             | Settings                  | App preferences, notifications, data export      |

### 2. Data Models

#### User Profile (Old → New)

```javascript
// OLD (Nutrition)
{
  email, password,
  age, weight, height,
  activityLevel: 'sedentary' | 'moderate' | 'active',
  goal: 'lose' | 'maintain' | 'gain',
  dietaryPreference: 'vegan' | 'keto' | 'balanced'
}

// NEW (Finance)
{
  email, password,
  age, // Keep for demographic insights
  monthlyIncome: Number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive',
  primaryGoal: 'save_emergency' | 'pay_debt' | 'invest' | 'budget_control',
  spendingCategories: ['essentials', 'lifestyle', 'impulse', 'savings']
}
```

#### Meal/Transaction Model (Old → New)

```javascript
// OLD (Meal)
{
  _id, userId,
  name: 'Grilled Chicken Salad',
  calories: 450,
  protein: 35, carbs: 20, fat: 15,
  loggedDate: Date
}

// NEW (Transaction)
{
  _id, userId,
  description: 'Coffee at Starbucks',
  amount: 5.75,
  category: 'impulse',
  mood: 'stressed' | 'happy' | 'neutral' | 'bored' | 'anxious',
  trigger: 'peer_pressure' | 'stress' | 'celebration' | 'habit',
  loggedDate: Date,
  notes: String // Optional user reflection
}
```

#### Daily Summary (Old → New)

```javascript
// OLD (Daily Calories)
{
  date: Date,
  totalCalories: 1800,
  totalProtein: 120,
  totalCarbs: 150,
  totalFat: 60
}

// NEW (Daily Spending)
{
  date: Date,
  totalSpent: 87.50,
  budgetLimit: 100,
  emotionalSpendingCount: 3, // Transactions marked as emotional
  topTrigger: 'stress',
  savingsProgress: 12.50 // Amount saved vs. goal
}
```

### 3. AI Agent Personality & Behavior

#### Old (Nutrition Expert)

```
You are a friendly, emoji-enhanced nutrition expert 🥗✨
- Provide safe dietary advice
- Reject medical diagnoses
- Focus on balanced eating habits
- Use food-related emojis
```

#### New (Financial Behavioral Coach)

```
You are a compassionate, non-judgmental financial behavioral coach 💰🧠
- Analyze spending patterns and emotional triggers
- Provide evidence-based behavioral finance strategies
- Reject legal/tax advice and investment recommendations
- Direct to certified financial planners for complex cases
- Use supportive, empowering language
- Focus on the "why" behind spending, not just the "what"
- Incorporate behavioral economics principles
```

#### AI Safety Rules (Updated)

```markdown
## Financial AI Safety Protocol

### ✅ The AI CAN:

- Analyze spending patterns and identify emotional triggers
- Suggest budgeting frameworks (50/30/20, zero-based, etc.)
- Provide general strategies for debt reduction
- Offer behavioral techniques (delay gratification, mindful spending)
- Celebrate financial wins and progress
- Ask reflective questions about spending habits

### ❌ The AI CANNOT:

- Provide specific investment recommendations
- Give tax advice or legal counsel
- Recommend individual stocks, crypto, or funds
- Make predictions about market performance
- Approve or deny loans, credit applications
- Access or modify actual bank accounts
- Diagnose financial trauma or mental health conditions

### ⚠️ Mandatory Disclosures:

When users ask for:

- Investment advice → "I can help you understand general investing principles, but for specific recommendations, consult a certified financial advisor."
- Tax questions → "Tax laws vary by location and situation. Please consult a CPA or tax professional."
- Debt management beyond general tips → "For personalized debt consolidation or bankruptcy advice, speak with a certified credit counselor."
```

### 4. API Endpoints (Renamed)

| **Old Endpoint**                   | **New Endpoint**         | **Purpose**                |
| ---------------------------------- | ------------------------ | -------------------------- |
| `POST /meals/log`                  | `POST /transactions/log` | Log a spending transaction |
| `GET /meals`                       | `GET /transactions`      | List user's transactions   |
| `GET /meals/:id`                   | `GET /transactions/:id`  | Get transaction detail     |
| `GET /dashboard/daily`             | `GET /dashboard/daily`   | Daily spending summary     |
| (All auth endpoints stay the same) | —                        | —                          |

### 5. Dashboard Calculations

```javascript
// OLD (Nutrition Dashboard)
const dailyCalories = meals.reduce((sum, m) => sum + m.calories, 0);
const dailyProtein = meals.reduce((sum, m) => sum + m.protein, 0);
// Compare to calorie goal

// NEW (Financial Dashboard)
const dailySpent = transactions.reduce((sum, t) => sum + t.amount, 0);
const emotionalSpending = transactions.filter(
  (t) => t.mood !== "neutral",
).length;
const topTrigger = getMostFrequentTrigger(transactions);
// Compare to daily budget limit
```

### 6. UI Text Changes (Global Search & Replace)

| **Find**             | **Replace**                       |
| -------------------- | --------------------------------- |
| "Calories"           | "Spending"                        |
| "Macros"             | "Budget Categories"               |
| "Meal"               | "Transaction" / "Purchase"        |
| "Recipe"             | "Savings Strategy"                |
| "Nutrition"          | "Financial Health"                |
| "Diet"               | "Budget"                          |
| "Food Diary"         | "Financial Journal"               |
| "Dietary Preference" | "Spending Category"               |
| "Activity Level"     | "Income Level" / "Risk Tolerance" |

---

## 🎨 UI DESIGN ADJUSTMENTS (Minimal)

### Color Palette Shift

```javascript
// OLD (Nutrition Theme)
primary: '#6FCF97', // Green for health
accent: '#F2994A', // Orange for energy
success: '#27AE60',
warning: '#EB5757'

// NEW (Financial Theme)
primary: '#2D9CDB', // Blue for trust & stability
accent: '#F2C94C', // Gold for wealth
success: '#27AE60', // Green for savings/gains
warning: '#EB5757', // Red for overspending
```

### Icon Replacements

- 🥗 → 💰 (salad → money)
- 🍎 → 📊 (apple → chart)
- 🏃 → 💼 (activity → career/income)
- 🥇 → 🎯 (goal achievement → financial target)

### Dashboard Metrics Display

```
OLD:
┌─────────────────┐
│ Daily Calories  │
│ 1,800 / 2,000   │
│ [Progress Bar]  │
└─────────────────┘

NEW:
┌─────────────────┐
│ Daily Spending  │
│ $87.50 / $100   │
│ [Progress Bar]  │
│ 3 emotional buys│
└─────────────────┘
```

---

## 🧠 AI PROMPT INJECTION (Context Building)

### Old System Prompt Template

```
You are a nutrition expert. User profile:
- Goal: {goal}
- Dietary Preference: {dietaryPreference}
- Activity Level: {activityLevel}

Provide personalized nutrition advice based on their goals.
```

### New System Prompt Template

```
You are a compassionate financial behavioral coach specializing in spending psychology.

User Profile:
- Primary Goal: {primaryGoal}
- Monthly Income: {monthlyIncome}
- Risk Tolerance: {riskTolerance}
- Recent Emotional Triggers: {topTriggers}

Your role:
1. Analyze the EMOTIONAL and PSYCHOLOGICAL reasons behind spending
2. Use behavioral finance principles (loss aversion, present bias, mental accounting)
3. Provide actionable strategies to align spending with long-term goals
4. Be supportive and non-judgmental—money shame is counterproductive
5. Ask reflective questions to build self-awareness

Recent Spending Context:
{recentTransactions}

Remember: Focus on the "why," not just the "how much."
```

---

## 🔐 SECURITY & PRIVACY (Enhanced)

### Additional Considerations for Financial Data

- **Encryption at rest**: Encrypt transaction descriptions and notes in MongoDB
- **No external sharing**: Never integrate with real banking APIs in MVP
- **Data retention policy**: Allow users to export and delete all financial logs
- **GDPR/CCPA compliance**: Clear consent for AI processing of financial reflections

### Environment Variables (Updated)

```env
# Backend .env (Updated Labels)
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...

AI_PROVIDER=gemini  # or openai
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# NEW: Financial-specific configs
DAILY_BUDGET_DEFAULT=100
EMERGENCY_FUND_MONTHS=3
```

---

## 📝 README UPDATES

Update the README to reflect:

1. **New App Purpose**: "AI Financial Behavioral Coach — Mindful Spending Tracker"
2. **Problem Statement**: Replace nutrition challenges with financial stress, lack of spending awareness, emotional triggers
3. **User Personas**: Busy professionals struggling with impulse buying, students managing limited budgets
4. **Key Features**: Behavioral dashboard, mood-based logging, AI financial coach
5. **Data Models**: Transaction schema with mood/trigger fields
6. **AI Behavior**: Financial coaching personality and safety rules

---

## 🚀 MIGRATION CHECKLIST

### Phase 1: Backend Changes (Low Risk)

- [ ] Rename `Meal` model → `Transaction` model
- [ ] Add `mood` and `trigger` fields to Transaction schema
- [ ] Update User model: replace nutrition fields with financial fields
- [ ] Rename `/meals/*` routes → `/transactions/*`
- [ ] Update AI system prompt template
- [ ] Modify daily summary calculations (calories → spending)

### Phase 2: Frontend Changes (UI Focused)

- [ ] Update theme colors (green → blue/gold)
- [ ] Global search & replace UI text (meals → transactions)
- [ ] Update Dashboard to show spending metrics
- [ ] Add mood selector to transaction logging form
- [ ] Update Profile screen fields (income, risk tolerance, goals)
- [ ] Replace nutrition-related icons with financial icons

### Phase 3: AI & Content

- [ ] Write new AI safety rules for financial advice
- [ ] Create seed data: example transactions with moods
- [ ] Update chat examples and onboarding flow
- [ ] Test AI responses for inappropriate financial advice

### Phase 4: Documentation

- [ ] Update README with financial focus
- [ ] Create new demo video
- [ ] Update presentation slides
- [ ] Write user guide for mood-based logging

---

## 🎯 EXPECTED OUTCOMES

### What This Pivot Achieves

1. **Reuses 90% of existing codebase** (architecture, auth, navigation, state management)
2. **Maintains design-first philosophy** (pixel-perfect UI, theme tokens)
3. **Leverages proven AI chat infrastructure** (history, context injection, safety)
4. **Extends behavioral tracking** (mood/trigger fields add depth beyond simple finance apps)
5. **Addresses underserved market**: Behavioral finance coaching vs. basic budgeting

### Differentiation from Traditional Finance Apps

- **Psychology-first**: Focus on _why_ you spend, not just _what_ you spend
- **Conversational AI**: Get personalized coaching, not generic tips
- **Emotional intelligence**: Track mood alongside money
- **Privacy-focused**: No bank account linking required

---

## ⚠️ RISKS & MITIGATIONS (Updated)

| **Risk**                                    | **Mitigation**                                                     |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Users expect real bank integration          | Clearly communicate this is a _behavioral tracker_, not a bank app |
| AI gives bad financial advice               | Strict safety protocols + "consult a professional" fallbacks       |
| Users overshare sensitive financial details | Encrypt data, allow full deletion, clear privacy policy            |
| Confusion with existing finance apps        | Emphasize _behavioral coaching_ angle in marketing                 |

---

## 📚 REFERENCES (Financial Behavioral Science)

Add these to your project proposal:

- **Thaler, R. H., & Sunstein, C. R.** (2008). _Nudge: Improving Decisions About Health, Wealth, and Happiness_. Yale University Press.
- **Kahneman, D., & Tversky, A.** (1979). Prospect Theory: An Analysis of Decision under Risk. _Econometrica, 47_(2), 263–291.
- **Ariely, D.** (2008). _Predictably Irrational: The Hidden Forces That Shape Our Decisions_. HarperCollins.
- **Loewenstein, G., & Prelec, D.** (1992). Anomalies in Intertemporal Choice: Evidence and an Interpretation. _The Quarterly Journal of Economics, 107_(2), 573–597.

---

## 🎬 FINAL INSTRUCTIONS

### For the Coding Agent:

1. **Preserve all existing architectural patterns** (no rewrites)
2. **Rename entities systematically** (meals → transactions, nutrition → financial)
3. **Update AI personality carefully** (test for safety compliance)
4. **Adjust UI theme minimally** (color swap + icon updates)
5. **Add mood/trigger fields thoughtfully** (user-friendly selection)

### For the Team:

- Run a full test of the authentication flow (should not change)
- Verify AI responses stay within financial behavioral coaching scope
- Update all documentation to reflect the pivot
- Create new demo scenarios: stress-buying, savings goals, budget tracking

---

## ✨ SUCCESS CRITERIA

The pivot is complete when:

- [ ] All "meal" references are replaced with "transaction"
- [ ] Dashboard shows spending vs. budget (not calories vs. goal)
- [ ] Transaction logging includes mood + trigger fields
- [ ] AI chat provides behavioral finance coaching (not nutrition advice)
- [ ] User profile stores income, risk tolerance, financial goals
- [ ] Theme uses blue/gold palette (not green/orange)
- [ ] README reflects financial behavioral coach positioning
- [ ] Demo video shows mood-based spending tracking

---

**END OF PIVOT PROMPT**

---

## 💡 Quick Reference: Entity Mapping

```
Nutrition Domain          →  Financial Domain
────────────────────────────────────────────────
Meal                     →  Transaction
Calories                 →  Amount Spent
Daily Calorie Goal       →  Daily Budget Limit
Macros (P/C/F)          →  Spending Categories
Food Diary              →  Financial Journal
Recipe                  →  Savings Strategy
Nutrition Expert        →  Financial Behavioral Coach
Dietary Preference      →  Spending Category
Activity Level          →  Income Level / Risk Tolerance
Weight Goal             →  Savings Goal
Meal Logging            →  Expense Logging + Mood
Daily Summary           →  Spending Dashboard
Overeating Trigger      →  Emotional Spending Trigger
```
