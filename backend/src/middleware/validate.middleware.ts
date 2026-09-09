/**
 * Validation Middleware
 *
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from "express";
import { validationResult, body } from "express-validator";

/**
 * Handle validation errors
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }

  next();
};

/**
 * User registration validation rules
 */
export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("profile.age")
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage("Age must be between 13 and 120"),
  body("profile.monthlyIncome")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Income must be a positive number"),
  body("profile.riskTolerance")
    .optional()
    .isIn(["conservative", "moderate", "aggressive"])
    .withMessage("Invalid risk tolerance"),
  body("profile.primaryGoal")
    .optional()
    .isIn(["save_emergency", "pay_debt", "invest", "budget_control"])
    .withMessage("Invalid primary goal"),
];

/**
 * User login validation rules
 */
export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Chat message validation rules
 */
export const chatMessageValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
];

/**
 * Transaction log validation rules
 */
export const transactionValidation = [
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),
  body("mood")
    .optional()
    .isIn(["stressed", "happy", "neutral", "bored", "anxious", "excited", "sad"])
    .withMessage("Invalid mood"),
  body("trigger")
    .optional()
    .isIn(["peer_pressure", "stress", "celebration", "habit", "boredom", "necessity"])
    .withMessage("Invalid trigger"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
];

export default {
  validate,
  registerValidation,
  loginValidation,
  chatMessageValidation,
  transactionValidation,
};
