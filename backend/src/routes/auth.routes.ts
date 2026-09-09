/**
 * Authentication Routes
 */

import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller";
import {
  registerValidation,
  loginValidation,
  validate,
} from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post("/register", registerValidation, validate, register);

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", loginValidation, validate, login);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post("/refresh", refreshToken);

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post("/logout", authenticate, logout);

export default router;
