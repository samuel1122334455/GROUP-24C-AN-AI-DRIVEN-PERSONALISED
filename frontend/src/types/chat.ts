/**
 * Chat Type Definitions
 */

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  error?: boolean;
  errorMessage?: string;
}

export interface ChatConversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  updatedAt: Date;
  lastMessage: {
    content: string;
    role: "user" | "assistant";
  } | null;
}

export interface SendMessageData {
  content: string;
  conversationId: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
}
