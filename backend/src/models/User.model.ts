/**
 * User Model - MongoDB Schema
 *
 * Defines user data structure and profile information
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile {
  age: number;
  monthlyIncome: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  primaryGoal: "save_emergency" | "pay_debt" | "invest" | "budget_control";
  spendingCategories: string[];
  monthlySavingsTarget: number;
}

export interface IUser extends Document {
  email: string;
  password: string; // Hashed
  name: string;
  profile: IUserProfile;
  refreshTokens: string[]; // Store active refresh tokens
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
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  age: { type: Number, default: 25, min: 13, max: 120 },
  monthlyIncome: { type: Number, default: 0, min: 0 },
  riskTolerance: {
    type: String,
    required: true,
    enum: ["conservative", "moderate", "aggressive"],
    default: "moderate",
  },
  primaryGoal: {
    type: String,
    required: true,
    enum: ["save_emergency", "pay_debt", "invest", "budget_control"],
    default: "budget_control",
  },
  spendingCategories: [{ type: String }],
  monthlySavingsTarget: { type: Number, default: 0, min: 0 },
});

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    profile: {
      type: UserProfileSchema,
      required: true,
    },
    refreshTokens: [{ type: String }],
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
  },
  {
    timestamps: true,
  }
);

// Don't return password and refresh tokens in queries by default
UserSchema.set("toJSON", {
  transform: function (_doc: any, ret: any) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", UserSchema);

export default User;
