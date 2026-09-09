# Frontend Setup Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on physical device (optional)

## Installation Steps

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API Configuration
# For iOS Simulator
API_BASE_URL=http://localhost:5000/api

# For Android Emulator
# API_BASE_URL=http://10.0.2.2:5000/api

# For Physical Device (replace with your computer's local IP)
# API_BASE_URL=http://192.168.1.XXX:5000/api

# App Environment
APP_ENV=development
```

**Finding Your Local IP:**

**Windows:**

```bash
ipconfig
# Look for "IPv4 Address" under your active network
```

**Mac/Linux:**

```bash
ifconfig
# Look for "inet" under your active network (usually en0)
```

### 4. Start the Backend

Make sure the backend is running first:

```bash
cd ../backend
npm run dev
```

### 5. Start the Frontend

```bash
cd ../frontend
npx expo start
```

### 6. Run on Device/Emulator

**iOS Simulator (Mac only):**

- Press `i` in the terminal

**Android Emulator:**

- Press `a` in the terminal

**Physical Device:**

- Scan QR code with Expo Go app
- Make sure device is on same WiFi network
- Update `API_BASE_URL` to your computer's local IP

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator (Mac only)
- `npm run web` - Start web version (limited support)
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Project Structure

```
frontend/
├── App.tsx                    # Main app entry point
├── app.json                   # Expo configuration
├── package.json
├── tsconfig.json
└── src/
    ├── api/                   # API client & endpoints
    │   ├── client.ts          # Axios instance with interceptors
    │   ├── auth.ts            # Auth API
    │   ├── user.ts            # User API
    │   ├── chat.ts            # Chat API
    │   └── meals.ts           # Meals API
    ├── stores/                # Zustand state management
    │   ├── authStore.ts       # Authentication state
    │   ├── userStore.ts       # User profile state
    │   ├── chatStore.ts       # Chat conversation state
    │   └── mealStore.ts       # Meals state
    ├── theme/                 # Global theme system
    │   ├── colors.ts          # Color palette
    │   ├── typography.ts      # Font styles
    │   ├── spacing.ts         # Spacing scale
    │   ├── radius.ts          # Border radius
    │   ├── shadows.ts         # Shadow presets
    │   └── index.ts           # Main theme export
    ├── navigation/            # React Navigation setup
    │   ├── AppNavigator.tsx   # Main navigator
    │   └── types.ts           # Navigation types
    ├── screens/               # Screen components
    │   ├── AuthScreen.tsx     # Login/Register (placeholder)
    │   ├── DashboardScreen.tsx # Dashboard (placeholder)
    │   ├── AIChatScreen.tsx   # AI Chat (placeholder)
    │   ├── ProfileScreen.tsx  # User Profile (placeholder)
    │   ├── SettingsScreen.tsx # Settings (placeholder)
    │   └── MealDetailScreen.tsx # Meal Detail (placeholder)
    ├── components/            # Reusable components (to be created)
    └── types/                 # TypeScript type definitions
        ├── user.ts
        ├── meal.ts
        └── chat.ts
```

## Theme System

All UI styling uses the centralized theme system. Never use hardcoded colors or spacing.

**Import theme:**

```typescript
import { colors, spacing, typography, radius, shadows } from "../theme";
```

**Example usage:**

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDark,
    padding: spacing.screenPadding,
    borderRadius: radius.xl,
  },
  text: {
    color: colors.textPrimaryDark,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
```

## State Management with Zustand

**Using a store:**

```typescript
import { useAuthStore } from "../stores/authStore";

const MyComponent = () => {
  const { isAuthenticated, setTokens } = useAuthStore();

  // Use state and actions
};
```

## Making API Calls

**Example:**

```typescript
import * as authApi from "../api/auth";

const handleLogin = async () => {
  try {
    const response = await authApi.login({ email, password });
    await setTokens(response.accessToken, response.refreshToken);
  } catch (error) {
    console.error(error.message);
  }
};
```

## Implementing Full Screens

The placeholder screens need to be replaced with full implementations that match the UI designs exactly.

### Steps to Implement Each Screen:

1. **Read the HTML design file** in `ai_chat_consult_UI/`
2. **Extract exact colors, spacing, and layout**
3. **Use theme system** (no hardcoded values)
4. **Create reusable components** in `src/components/`
5. **Connect to API** using stores and API layer
6. **Test on multiple screen sizes**

### Example: Dashboard Screen

The dashboard should include:

- Calorie progress ring
- Macro breakdown bars (Protein, Carbs, Fat)
- Quick action buttons
- AI meal suggestions
- Bottom navigation

All values should come from the API via `useUserStore` and `useMealStore`.

## Troubleshooting

### Can't Connect to Backend

- Verify backend is running on port 5000
- Check `API_BASE_URL` in `.env`
- For Android emulator, use `http://10.0.2.2:5000/api`
- For physical device, use your computer's local IP

### App Crashes on Start

- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start -c`
- Check all dependencies are installed

### TypeScript Errors

- Run type check: `npm run type-check`
- Check all imports are correct
- Ensure types match API responses

## Next Steps

1. **Implement full screen designs** matching HTML mockups
2. **Create reusable components** (buttons, cards, inputs)
3. **Add comprehensive error handling**
4. **Implement loading states**
5. **Add animations** for better UX
6. **Test on physical devices**

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

## Need Help?

Check the main README.md for more information or open an issue on GitHub.
