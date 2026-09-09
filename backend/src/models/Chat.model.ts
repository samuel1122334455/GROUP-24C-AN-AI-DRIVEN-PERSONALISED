/**
 * Chat Model - MongoDB Schema
 *
 * Stores conversation history. Multiple conversations allowed per user.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: { error?: boolean; errorMessage?: string };
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    error: { type: Boolean },
    errorMessage: { type: String },
  },
});

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Chat" },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

ChatSchema.index({ userId: 1, updatedAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
export default Chat;
