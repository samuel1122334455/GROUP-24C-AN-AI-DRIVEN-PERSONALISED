/**
 * JWT Utility
 *
 * Helper functions for JWT token generation and verification
 */

import jwt from "jsonwebtoken";
import { config } from "../config/environment";
import { AppError } from "../middleware/error.middleware";

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as jwt.SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: JWTPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
