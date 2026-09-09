/**
 * WeeklyReport Model - MongoDB Schema
 *
 * Defines weekly spending report data structure for users
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklyReport extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  totalSpent: number;
  topCategory: string;
  txCount: number;
  aiSummary: string;
  createdAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart:   { type: Date, required: true },
    weekEnd:     { type: Date, required: true },
    totalSpent:  { type: Number, required: true },
    topCategory: { type: String, required: true },
    txCount:     { type: Number, required: true },
    aiSummary:   { type: String, required: true },
  },
  { timestamps: true }
);

export const WeeklyReport = mongoose.model<IWeeklyReport>("WeeklyReport", WeeklyReportSchema);

export default WeeklyReport;
