/**
 * Chat API - AI conversation endpoints
 */

import apiClient, { handleApiError } from "./client";
import {
  SendMessageData,
  SendMessageResponse,
  ChatConversation,
  ConversationSummary,
} from "../types/chat";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export const listConversations = async (): Promise<ConversationSummary[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ConversationSummary[]>>("/chat/conversations");
    return response.data.data ?? [];
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const createConversation = async (): Promise<{ _id: string; title: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ _id: string; title: string }>>("/chat/conversations");
    if (!response.data?.data) throw new Error("Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const sendMessage = async (data: SendMessageData): Promise<SendMessageResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<SendMessageResponse>>("/chat/message", data);
    if (!response.data?.data) throw new Error(response.data?.message || "Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getConversation = async (conversationId: string): Promise<ChatConversation> => {
  try {
    const response = await apiClient.get<ApiResponse<ChatConversation>>(
      `/chat/conversation/${conversationId}`
    );
    if (!response.data?.data) throw new Error(response.data?.message || "Invalid server response");
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const clearConversation = async (conversationId: string): Promise<void> => {
  try {
    await apiClient.delete(`/chat/conversation/${conversationId}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export default { listConversations, createConversation, sendMessage, getConversation, clearConversation };
