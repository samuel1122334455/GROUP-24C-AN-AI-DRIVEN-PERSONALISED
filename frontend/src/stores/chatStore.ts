/**
 * Chat Store - Zustand
 *
 * Manages chat conversation and messages
 */

import { create } from "zustand";
import { ChatMessage, ChatConversation } from "../types/chat";

interface ChatState {
  // State
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;

  // Actions
  setConversation: (conversation: ChatConversation) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearChat: () => void;
  setLoading: (isLoading: boolean) => void;
  setSending: (isSending: boolean) => void;
}

export const useChatStore = create<ChatState>((set: any) => ({
  // Initial state
  conversation: null,
  messages: [],
  isLoading: false,
  isSending: false,

  /**
   * Set the entire conversation
   */
  setConversation: (conversation: ChatConversation) => {
    set({
      conversation,
      messages: conversation.messages,
      isLoading: false,
    });
  },

  /**
   * Add a new message to the chat
   */
  addMessage: (message: ChatMessage) => {
    set((state: any) => ({
      messages: [...state.messages, message],
      isSending: false,
    }));
  },

  /**
   * Replace all messages
   */
  setMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  /**
   * Clear chat history
   */
  clearChat: () => {
    set({
      conversation: null,
      messages: [],
      isLoading: false,
      isSending: false,
    });
  },

  /**
   * Set loading state (for fetching conversation)
   */
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  /**
   * Set sending state (for sending messages)
   */
  setSending: (isSending: boolean) => {
    set({ isSending });
  },
}));

export default useChatStore;
