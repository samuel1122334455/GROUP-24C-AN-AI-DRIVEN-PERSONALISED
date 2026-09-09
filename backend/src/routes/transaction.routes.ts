/**
 * Transaction Routes
 */

import { Router } from "express";
import {
  getTransactions,
  getTransactionById,
  logTransaction,
  deleteTransaction,
  parseReceiptWithAI,
} from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";
// import { transactionValidation, validate } from "../middleware/validate.middleware";

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * GET /api/transactions
 * Get all user transactions
 */
router.get("/", getTransactions);

/**
 * GET /api/transactions/log
 * Optional: Legacy/Compatibility route if needed, or handled by POST
 */

/**
 * POST /api/transactions/log
 * Log a new transaction
 */
router.post("/log", logTransaction);
router.post("/parse-receipt", parseReceiptWithAI);

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete("/:id", deleteTransaction);

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get("/:id", getTransactionById);

export default router;
