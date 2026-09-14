/** Owner-scoped Notification API routes. */
export const notificationRoutes = {
  feed: "/api/notifications",
  unreadCount: "/api/notifications/unread-count",
  markRead: (id) => `/api/notifications/${id}/read`,
  markAllRead: "/api/notifications/read-all",
  preferences: "/api/notification-preferences",
  preference: (id) => `/api/notification-preferences/${id}`,
};
