import { Router } from "express";
import {
  listNotifications,
  getNotification,
  markRead,
  markAllRead,
} from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.get("/:id", getNotification);
router.patch("/:id/read", markRead);

export default router;
