export interface WeeklyReportSummary {
  _id: string;
  weekStart: string;
  weekEnd: string;
  totalSpent: number;
  topCategory: string;
  txCount: number;
  createdAt: string;
}

export interface WeeklyReportDetail extends WeeklyReportSummary {
  aiSummary: string;
}
