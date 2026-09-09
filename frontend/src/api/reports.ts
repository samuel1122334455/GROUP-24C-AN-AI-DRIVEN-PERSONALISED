import apiClient, { handleApiError } from "./client";
import { WeeklyReportSummary, WeeklyReportDetail } from "../types/report";

type ApiResponse<T> = { success: boolean; data?: T; message?: string };

export const getReports = async (): Promise<WeeklyReportSummary[]> => {
  try {
    const res = await apiClient.get<ApiResponse<WeeklyReportSummary[]>>("/user/reports");
    return res.data?.data ?? [];
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const getReportById = async (id: string): Promise<WeeklyReportDetail> => {
  try {
    const res = await apiClient.get<ApiResponse<WeeklyReportDetail>>(`/user/reports/${id}`);
    if (!res.data?.data) throw new Error("Report not found");
    return res.data.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};
