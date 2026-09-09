/**
 * Password Utility
 *
 * Helper functions for password hashing and verification using bcrypt
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Failed to hash password");
  }
};

/**
 * Compare plain text password with hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error("Failed to compare passwords");
  }
};

export default {
  hashPassword,
  comparePassword,
};
