/**
 * Transaction Controller
 *
 * Handles transaction data and logging
 * Updated: Force refresh
 */

import { Response } from "express";
import { Transaction } from "../models/Transaction.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError, catchAsync } from "../middleware/error.middleware";
import { checkAndSendSpendingAlert } from "../services/notification.service";
import { aiService } from "../services/ai/aiService";
import { AIMessage } from "../services/ai/provider.interface";

/**
 * Get all user transactions
 */
export const getTransactions = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const dateParam = req.query.date as string;

  let query: any = { userId };

  if (dateParam) {
    const date = new Date(dateParam);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const transactions = await Transaction.find(query).sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: transactions,
  });
});

/**
 * Log a transaction
 */
export const logTransaction = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { description, amount, category, mood, trigger, notes, date } = req.body;

  if (require("mongoose").connection.readyState !== 1) {
    throw new AppError("Database unavailable — please restart the server and ensure MongoDB is running.", 503);
  }

  const transaction = await Transaction.create({
    userId,
    description,
    amount,
    category,
    mood,
    trigger,
    notes,
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json({
    success: true,
    message: "Transaction logged successfully",
    data: transaction,
  });

  const alertUserId = req.user?.userId!;
  Transaction.find({
    userId: alertUserId,
    date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  }).then((todayTxs) => {
    const todayTotal = todayTxs.reduce((sum, t) => sum + t.amount, 0);
    checkAndSendSpendingAlert(alertUserId, todayTotal).catch(console.error);
  });
});

/**
 * Get transaction by ID
 */
export const getTransactionById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const transaction = await Transaction.findOne({ _id: id, userId });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

/**
 * Delete transaction
 */
export const deleteTransaction = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const transaction = await Transaction.findOne({ _id: id, userId });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  await transaction.deleteOne();

  res.status(200).json({
    success: true,
    message: "Transaction deleted successfully",
  });
});

const VALID_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

/**
 * POST /api/transactions/parse-receipt
 * Send a receipt image to the AI and return structured transaction data.
 */
export const parseReceiptWithAI = catchAsync(async (req: AuthRequest, res: Response) => {
  const { imageBase64, imageMimeType } = req.body;
  if (!imageBase64 || !imageMimeType) {
    throw new AppError("imageBase64 and imageMimeType are required", 400);
  }

  const today = new Date().toISOString().split("T")[0];
  const prompt = `You are a receipt data extractor. Analyze this receipt image and extract the transaction details.

Respond ONLY with a valid JSON object — no markdown, no explanation, no extra text:
{
  "description": "merchant or store name (max 50 chars)",
  "amount": 0.00,
  "category": "Food",
  "date": "${today}",
  "notes": "brief description of items purchased"
}

Rules:
- description: the merchant/store name, short and clear
- amount: the TOTAL amount paid as a plain number (no symbols, always positive)
- category: MUST be exactly one of: Food, Transport, Shopping, Bills, Entertainment, Health, Other
- date: receipt date in YYYY-MM-DD format — use ${today} if not visible
- notes: 1 sentence summary of what was purchased, or empty string`;

  const messages: AIMessage[] = [{ role: "user", content: prompt }];

  const aiResponse = await aiService.chat(messages, undefined, imageBase64, imageMimeType);

  // Extract JSON block robustly (AI sometimes wraps in markdown)
  const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError("AI could not read this receipt. Please try a clearer photo.", 422);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError("AI returned an unexpected format. Please try again.", 422);
  }

  const amount = Math.abs(parseFloat(parsed.amount));
  if (!parsed.description || isNaN(amount)) {
    throw new AppError("Could not extract amount or description from receipt.", 422);
  }

  const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "Other";

  res.json({
    success: true,
    data: {
      description: String(parsed.description).slice(0, 50).trim(),
      amount: parseFloat(amount.toFixed(2)),
      category,
      date: parsed.date || today,
      notes: String(parsed.notes || "").trim(),
    },
  });
});

export default {
    getTransactions,
    logTransaction,
    getTransactionById,
    deleteTransaction,
    parseReceiptWithAI,
};
