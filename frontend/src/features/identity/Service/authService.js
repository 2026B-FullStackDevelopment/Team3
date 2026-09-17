import { httpClient } from '@/shared/api/apiFetch.js'
import { authRoutes } from '@/config/api/routes/index.js'

/**
 * Identity/auth Service — the auth sub-domain's only httpClient caller.
 */
export const authService = {
  register: (payload) => httpClient.post(authRoutes.register, payload),
  login: (credentials) => httpClient.post(authRoutes.login, credentials),
  logout: () => httpClient.post(authRoutes.logout),
  me: () => httpClient.get(authRoutes.me),
}
