import { httpClient } from '@/config/api/httpClient.js'
import { authRoutes, profileRoutes } from '@/config/api/routes/index.js'

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

  getProfile: () => httpClient.get(profileRoutes.get),
  updateProfile: (patch) => httpClient.patch(profileRoutes.update, patch),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return httpClient.post(profileRoutes.avatar, form)
  },
  removeAvatar: () => httpClient.delete(profileRoutes.avatar),
  // 401 here = "current password incorrect" (a domain error), NOT an expired
  // session — opt out of the global 401→logout so the modal can show it inline.
  changePassword: (payload) =>
    httpClient.patch(profileRoutes.changePassword, payload, { suppressUnauthorized: true }),
}
