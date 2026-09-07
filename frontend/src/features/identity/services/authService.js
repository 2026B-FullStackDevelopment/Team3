import { httpClient } from '@/config/api/httpClient.js'
import { authRoutes } from '@/config/api/routes/index.js'

/**
 * Identity Service layer (SRS A.1.3) — the only place that calls the HTTP helper
 * for auth. Returns the normalized { data, status, ok, error } result upward.
 */
export const authService = {
  register: (payload) => httpClient.post(authRoutes.register, payload),
  login: (credentials) => httpClient.post(authRoutes.login, credentials),
  logout: () => httpClient.post(authRoutes.logout),
  me: () => httpClient.get(authRoutes.me),
}
