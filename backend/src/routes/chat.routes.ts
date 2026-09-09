/**
 * Chat Routes
 */

import { Router } from "express";
import {
  listConversations,
  createConversation,
  sendMessage,
  sendMessageStream,
  getConversation,
  clearConversation,
} from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.post("/message", sendMessage);
router.post("/message-stream", sendMessageStream);
router.get("/conversation/:conversationId", getConversation);
router.delete("/conversation/:conversationId", clearConversation);

export default router;
