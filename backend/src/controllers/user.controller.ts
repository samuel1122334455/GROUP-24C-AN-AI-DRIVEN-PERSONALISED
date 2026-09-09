/**
 * User Controller
 *
 * Handles user profile and spending summary operations
 */

import { Response } from "express";
import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";
import { WeeklyReport } from "../models/WeeklyReport.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError, catchAsync } from "../middleware/error.middleware";

/**
 * Get user profile
 */
export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      data: user.toJSON(),
    });
  }
);

/**
 * Update user profile
 */
export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { name, profile } = req.body;

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

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!user) throw new AppError("User not found", 404);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user.toJSON(),
    });
  }
);

/**
 * Get spending summary
 */
export const getSpendingSummary = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const dateParam = req.query.date as string;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Parse date or use today
    const date = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get all transactions for the day
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Calculate totals
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const emotionalSpendingCount = transactions.filter(
      (t) => t.mood && t.mood !== "neutral"
    ).length;
    
    // Find top trigger (simple frequency count)
    const triggerCounts: Record<string, number> = {};
    transactions.forEach(t => {
        if (t.trigger) {
            triggerCounts[t.trigger] = (triggerCounts[t.trigger] || 0) + 1;
        }
    });
    
    let topTrigger: string | undefined = undefined;
    if (Object.keys(triggerCounts).length > 0) {
        topTrigger = Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b);
    }
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const spendableIncome = Math.max(0, user.profile.monthlyIncome - (user.profile.monthlySavingsTarget ?? 0));
    const dailyBudget = spendableIncome > 0 ? spendableIncome / daysInMonth : 100;

    const summary = {
      date: startOfDay.toISOString(),
      totalSpent,
      budgetLimit: Math.round(dailyBudget),
      emotionalSpendingCount,
      topTrigger,
      savingsProgress: 0, // Placeholder for actual savings logic
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
);

/**
 * Delete user account
 */
export const deleteAccount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    await User.findByIdAndDelete(userId);
    await Transaction.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  }
);

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

export default {
  getProfile,
  updateProfile,
  getSpendingSummary,
  deleteAccount,
  savePushToken,
  getReports,
  getReportById,
};
