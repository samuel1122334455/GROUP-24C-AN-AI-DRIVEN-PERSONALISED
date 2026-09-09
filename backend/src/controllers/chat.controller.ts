/**
 * Chat Controller
 *
 * Handles multi-conversation AI chat
 */

import { Response } from "express";
import { Chat } from "../models/Chat.model";
import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError, catchAsync } from "../middleware/error.middleware";
import { aiService } from "../services/ai/aiService";
import { AIMessage } from "../services/ai/provider.interface";

export const listConversations = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const conversations = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();

  const summaries = conversations.map((conv) => ({
    _id: conv._id,
    title: conv.title,
    updatedAt: conv.updatedAt,
    lastMessage:
      conv.messages.length > 0
        ? {
            content: conv.messages[conv.messages.length - 1].content.substring(0, 80),
            role: conv.messages[conv.messages.length - 1].role,
          }
        : null,
  }));

  res.status(200).json({ success: true, data: summaries });
});

export const createConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const conversation = await Chat.create({ userId, title: "New Chat", messages: [] });

  res.status(201).json({
    success: true,
    data: { _id: conversation._id, title: conversation.title },
  });
});

export const sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401);

  const { content, conversationId, imageBase64, imageMimeType } = req.body;
  if (!conversationId) throw new AppError("conversationId is required", 400);

  const conversation = await Chat.findOne({ _id: conversationId, userId });
  if (!conversation) throw new AppError("Conversation not found", 404);

  conversation.messages.push({ role: "user", content, timestamp: new Date() });

  // Auto-title from first user message
  if (conversation.messages.filter((m) => m.role === "user").length === 1) {
    conversation.title = content.substring(0, 50).trim();
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [user, monthlyTransactions] = await Promise.all([
    User.findById(userId),
    Transaction.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).lean(),
  ]);

  let userContext: string | undefined;
  if (user) {
    const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    const byCategory = monthlyTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    const month = now.toLocaleString("default", { month: "long", year: "numeric" });
    userContext = aiService.formatUserContext(user, { totalSpent, byCategory, month });
  }

  try {
    const recentMessages = conversation.messages.slice(-105);
    const aiMessages: AIMessage[] = recentMessages.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const aiResponse = await aiService.chat(aiMessages, userContext, imageBase64, imageMimeType);

    const assistantMessage = {
      role: "assistant" as const,
      content: aiResponse.content,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { message: assistantMessage, conversationId: conversation._id },
    });
  } catch (error: any) {
    const errorMessage = {
      role: "assistant" as const,
      content: "I apologize, but I encountered an error processing your request. Please try again.",
      timestamp: new Date(),
      metadata: { error: true, errorMessage: error.message },
    };
    conversation.messages.push(errorMessage);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { message: errorMessage, conversationId: conversation._id },
    });
  }
});

export const getConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;

  const conversation = await Chat.findOne({ _id: conversationId, userId });

  if (!conversation) {
    res.status(200).json({
      success: true,
      data: {
        _id: null,
        userId,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return;
  }

  res.status(200).json({ success: true, data: conversation });
});

/**
 * SSE streaming endpoint — sends AI response in chunks as Server-Sent Events.
 * Not wrapped in catchAsync because headers are flushed before streaming starts.
 */
export const sendMessageStream = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const { content, conversationId } = req.body;
  if (!conversationId || !content) {
    res.status(400).json({ success: false, message: "content and conversationId are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let closed = false;
  req.on("close", () => { closed = true; });

  try {
    const conversation = await Chat.findOne({ _id: conversationId, userId });
    if (!conversation) { send({ error: "Conversation not found" }); res.end(); return; }

    conversation.messages.push({ role: "user", content, timestamp: new Date() });
    if (conversation.messages.filter((m: any) => m.role === "user").length === 1) {
      conversation.title = content.substring(0, 50).trim();
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [user, monthlyTransactions] = await Promise.all([
      User.findById(userId),
      Transaction.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).lean(),
    ]);

    let userContext: string | undefined;
    if (user) {
      const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
      const byCategory = monthlyTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      const month = now.toLocaleString("default", { month: "long", year: "numeric" });
      userContext = aiService.formatUserContext(user, { totalSpent, byCategory, month });
    }

    const recentMessages = conversation.messages.slice(-105);
    const aiMessages: AIMessage[] = recentMessages.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    let fullContent = "";

    await aiService.stream(aiMessages, userContext, (delta) => {
      if (closed) return;
      fullContent += delta;
      send({ delta });
    });

    conversation.messages.push({
      role: "assistant",
      content: fullContent || "I apologize, I could not generate a response.",
      timestamp: new Date(),
    });
    await conversation.save();

    send({ done: true });
    res.end();
  } catch (error: any) {
    console.error("Stream error:", error.message);
    try { send({ error: error.message || "Stream failed" }); res.end(); } catch {}
  }
};

export const clearConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;

  await Chat.findOneAndDelete({ _id: conversationId, userId });

  res.status(200).json({ success: true, message: "Conversation deleted successfully" });
});

export default { listConversations, createConversation, sendMessage, getConversation, clearConversation };
