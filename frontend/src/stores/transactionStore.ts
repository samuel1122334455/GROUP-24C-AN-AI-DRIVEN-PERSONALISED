import { create } from "zustand";
import { Transaction, TransactionSummary, CreateTransactionData } from "../types/transaction";
import transactionApi from "../api/transactions";

interface TransactionState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
  summary: TransactionSummary | null;

  fetchTransactions: (date?: string) => Promise<void>;
  getTransaction: (id: string) => Promise<void>;
  addTransaction: (data: CreateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearCurrentTransaction: () => void;
  calculateSummary: (budgetLimit: number) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  currentTransaction: null,
  isLoading: false,
  error: null,
  summary: null,

  fetchTransactions: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.getTransactions(date);
      set({ transactions: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to fetch transactions",
      });
    }
  },

  getTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.getTransactionById(id);
      set({ currentTransaction: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to fetch transaction",
      });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.logTransaction(data);
      const newTransaction = response.data;
      
      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to log transaction",
      });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await transactionApi.deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to delete transaction",
      });
    }
  },

  clearCurrentTransaction: () => {
    set({ currentTransaction: null });
  },

  calculateSummary: (budgetLimit) => {
    const { transactions } = get();
    // Assuming transactions are already filtered by date if needed, 
    // or we filter them here. For now, we assume user fetches daily transactions for dashboard.
    
    // Check if transactions are for today? 
    // The fetchTransactions is usually called with a date param for dashboard.
    
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    set({
      summary: {
        date: new Date().toISOString(),
        totalSpent,
        transactionCount: transactions.length,
      },
    });
  },
}));
