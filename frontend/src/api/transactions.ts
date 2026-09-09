import client from "./client";
import { Transaction, CreateTransactionData } from "../types/transaction";

export const getTransactions = async (date?: string) => {
  const params: any = {};
  if (date) params.date = date;
  
  const response = await client.get("/transactions", { params });
  return response.data;
};

export const getTransactionById = async (id: string) => {
  const response = await client.get(`/transactions/${id}`);
  return response.data;
};

export const logTransaction = async (data: CreateTransactionData) => {
  const response = await client.post("/transactions/log", data);
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  const response = await client.delete(`/transactions/${id}`);
  return response.data;
};

export interface ParsedReceipt {
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
}

export const parseReceipt = async (
  imageBase64: string,
  imageMimeType: string
): Promise<ParsedReceipt> => {
  // AI vision calls can take up to 60 s — override the default 30 s timeout
  const response = await client.post<{ success: boolean; data: ParsedReceipt }>(
    "/transactions/parse-receipt",
    { imageBase64, imageMimeType },
    { timeout: 90_000 }
  );
  return response.data.data;
};

export default {
  getTransactions,
  getTransactionById,
  logTransaction,
  deleteTransaction,
  parseReceipt,
};
