import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: { today: [], yesterday: [], older: [] },
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) =>
    set((state) => {
      const updated = { ...state.notifications };
      updated.today.unshift(notification);
      return { 
        notifications: updated,
        unreadCount: state.unreadCount + 1,
      };
    }),

  clearUnread: () => set({ unreadCount: 0 }),
}));
