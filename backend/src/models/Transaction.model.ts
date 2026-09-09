/**
 * Transaction Model - MongoDB Schema
 *
 * Defines financial transaction data structure
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  category: string;
  mood?: "stressed" | "happy" | "neutral" | "bored" | "anxious" | "excited" | "sad";
  trigger?: "peer_pressure" | "stress" | "celebration" | "habit" | "boredom" | "necessity";
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    mood: {
      type: String,
      enum: ["stressed", "happy", "neutral", "bored", "anxious", "excited", "sad"],
      default: "neutral",
    },
    trigger: {
      type: String,
      enum: ["peer_pressure", "stress", "celebration", "habit", "boredom", "necessity"],
    },
    notes: { type: String },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for faster queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ mood: 1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;
