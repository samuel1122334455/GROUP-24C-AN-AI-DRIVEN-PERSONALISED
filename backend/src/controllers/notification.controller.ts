import { Response } from "express";
import { Notification } from "../models/Notification.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError, catchAsync } from "../middleware/error.middleware";

export const listNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, data: { notifications, unreadCount } });
});

export const getNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const notification = await Notification.findOne({ _id: req.params.id, userId }).lean();
  if (!notification) throw new AppError("Notification not found", 404);
  res.json({ success: true, data: notification });
});

export const markRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  await Notification.updateOne({ _id: req.params.id, userId }, { isRead: true });
  res.json({ success: true });
});

export const markAllRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  res.json({ success: true });
});
