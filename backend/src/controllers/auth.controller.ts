/**
 * Authentication Controller
 *
 * Handles user registration, login, token refresh, and logout
 */

import { Request, Response } from "express";
import { User } from "../models/User.model";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateTokenPair, verifyRefreshToken, JWTPayload } from "../utils/jwt.util";
import { AppError, catchAsync } from "../middleware/error.middleware";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, profile } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email already registered", 409);

  const normalizedProfile = {
    age: profile?.age ?? 25,
    monthlyIncome: profile?.monthlyIncome ?? 0,
    primaryGoal: profile?.primaryGoal ?? "budget_control",
    riskTolerance: profile?.riskTolerance ?? "moderate",
    spendingCategories: profile?.spendingCategories ?? [],
  };

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    profile: normalizedProfile,
  });

  const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  user.refreshTokens = [refreshToken];
  await user.save();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user: user.toJSON(), accessToken, refreshToken },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

  const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  const updatedTokens = [...user.refreshTokens, refreshToken];
  const trimmedTokens = updatedTokens.length > 5 ? updatedTokens.slice(-5) : updatedTokens;
  await User.updateOne({ _id: user._id }, { refreshTokens: trimmedTokens });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: user.toJSON(), accessToken, refreshToken },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token required", 400);

  let payload: JWTPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError("Invalid refresh token", 401);
  }

  const newPayload: JWTPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(newPayload);

  const newTokens = [...user.refreshTokens.filter((t) => t !== refreshToken), newRefreshToken];
  await User.updateOne({ _id: user._id }, { refreshTokens: newTokens });

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const userId = (req as any).user?.userId;

  if (userId && refreshToken) {
    const user = await User.findById(userId);
    if (user) {
      await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: refreshToken } });
    }
  }

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default { register, login, refreshToken, logout };
