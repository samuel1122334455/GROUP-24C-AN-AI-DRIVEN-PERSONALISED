/**
 * User Routes
 */

import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getSpendingSummary, // Changed getDailySummary
  deleteAccount,
  savePushToken,
  getReports,
  getReportById,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get("/profile", getProfile);

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put("/profile", updateProfile);

/**
 * GET /api/user/spending-summary
 * Get daily spending summary
 * Optional query param: ?date=2024-01-05
 */
router.get("/spending-summary", getSpendingSummary);

// Legacy route support (optional) - redirect or alias if needed
// router.get("/daily-summary", getSpendingSummary);

/**
 * DELETE /api/user/account
 * Delete user account
 */
router.delete("/account", deleteAccount);

router.post("/push-token", authenticate, savePushToken);
router.get("/reports", authenticate, getReports);
router.get("/reports/:id", authenticate, getReportById);

export default router;
