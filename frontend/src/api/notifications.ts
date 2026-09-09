import apiClient, { handleApiError } from "./client";
import { AppNotification } from "../stores/notificationStore";

type ListResponse = { notifications: AppNotification[]; unreadCount: number };

export const fetchNotifications = async (): Promise<ListResponse> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: ListResponse }>("/notifications");
    return res.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    await apiClient.patch(`/notifications/${id}/read`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    await apiClient.patch("/notifications/read-all");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
