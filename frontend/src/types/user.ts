/**
 * User Type Definitions
 */

export interface UserPrefs {
  spendingAlerts: boolean;
  weeklyReport: boolean;
  checkIn: boolean;
  currency: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  userPrefs?: UserPrefs;
  hasCompletedOnboarding?: boolean;
}

export interface UserProfile {
  // Basic stats
  age: number;
  monthlyIncome: number;

  // Goals & Preferences
  primaryGoal: "save_emergency" | "pay_debt" | "invest" | "budget_control";
  riskTolerance: "conservative" | "moderate" | "aggressive";

  // Categories
  spendingCategories: string[];

  // UI preferences
  currency: string;

  monthlySavingsTarget?: number;
}

export interface SpendingSummary {
  date: string; // ISO date string
  totalSpent: number;
  budgetLimit: number;
  emotionalSpendingCount: number;
  topTrigger?: string;
  savingsProgress: number;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  profile: Partial<UserProfile>;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  name?: string;
  profile?: Partial<UserProfile>;
}


