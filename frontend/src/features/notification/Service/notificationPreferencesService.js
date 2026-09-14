import { httpClient } from '@/config/api/httpClient.js'
import { notificationRoutes } from '@/config/api/routes/index.js'

/**
 * Notification module Service — the module's only httpClient caller.
 * Returns the normalized { data, status, ok, error } result upward.
 */
export const notificationPreferencesService = {
  getPreferences: () => httpClient.get(notificationRoutes.preferences),
  createPreference: (body) => httpClient.post(notificationRoutes.preferences, body),
  updatePreference: (id, body) => httpClient.patch(notificationRoutes.preference(id), body),
  deletePreference: (id) => httpClient.delete(notificationRoutes.preference(id)),
}
