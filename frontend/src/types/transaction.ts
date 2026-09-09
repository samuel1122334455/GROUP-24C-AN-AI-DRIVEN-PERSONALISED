/**
 * Transaction Type Definitions
 */

export interface Transaction {
  _id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  mood?: "stressed" | "happy" | "neutral" | "bored" | "anxious" | "excited" | "sad";
  trigger?: "peer_pressure" | "stress" | "celebration" | "habit" | "boredom" | "necessity";
  notes?: string;
  date: Date; // or string if coming from JSON, but normally Date in TS if parsed
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  category: string;
  mood?: string;
  trigger?: string;
  notes?: string;
  date?: string; // ISO date
}

export interface TransactionSummary {
  date: string;
  totalSpent: number;
  transactionCount: number;
}
