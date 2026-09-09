import { create } from "zustand";

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: "spending_alert_80" | "spending_alert_100" | "weekly_report" | "check_in" | "general";
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: AppNotification[], unreadCount: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),

  markRead: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n._id === id);
      const wasUnread = target && !target.isRead;
      return {
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () => set({ notifications: [], unreadCount: 0, isLoading: false }),
}));
