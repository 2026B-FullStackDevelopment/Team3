import { httpClient } from '@/config/api/httpClient.js'
import { profileRoutes } from '@/config/api/routes/index.js'

/**
 * Identity/profile Service — the profile sub-domain's only httpClient caller.
 */
export const profileService = {
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
