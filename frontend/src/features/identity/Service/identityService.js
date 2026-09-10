import { httpClient } from '@/config/api/httpClient.js'
import { authRoutes } from '@/config/api/routes/index.js'

/**
 * Identity module Service (SRS A.1.3) — the module's only httpClient caller.
 * One function per identity endpoint; returns the normalized
 * { data, status, headers, ok, error } result upward.
 */
export const identityService = {
  register: (payload) => httpClient.post(authRoutes.register, payload),
  login: (credentials) => httpClient.post(authRoutes.login, credentials),
  logout: () => httpClient.post(authRoutes.logout),
  me: () => httpClient.get(authRoutes.me),
}
