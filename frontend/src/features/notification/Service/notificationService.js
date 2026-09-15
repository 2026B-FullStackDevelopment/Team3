import { httpClient } from '@/config/api/httpClient.js'
import { notificationRoutes } from '@/config/api/routes/index.js'

export const notificationService = {
  list: ({ page = 1, limit = 20, unreadOnly } = {}) =>
    httpClient.get(notificationRoutes.feed, { params: { page, limit, unreadOnly } }),
  unreadCount: () => httpClient.get(notificationRoutes.unreadCount),
  markRead: (notificationId) => httpClient.patch(notificationRoutes.markRead(notificationId)),
  markAllRead: () => httpClient.patch(notificationRoutes.markAllRead),
}
