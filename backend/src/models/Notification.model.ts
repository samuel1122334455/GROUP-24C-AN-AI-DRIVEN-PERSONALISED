import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
  | "spending_alert_80"
  | "spending_alert_100"
  | "weekly_report"
  | "check_in"
  | "general";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["spending_alert_80", "spending_alert_100", "weekly_report", "check_in", "general"],
      default: "general",
    },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;
