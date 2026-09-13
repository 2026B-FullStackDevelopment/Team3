import { env } from '@/config/env.js'

/**
 * Normalizes an avatar URL for <Avatar src>. Local uploads are stored as a
 * relative "/upload/..." path; prefix the API base so they resolve in every
 * environment. Absolute URLs pass through. Returns null when absent.
 */
export function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null
  if (/^https?:\/\//.test(avatarUrl)) return avatarUrl
  return `${env.API_BASE_URL}${avatarUrl}`
}

/**
 * Shapes GET /api/profile (and the profile envelope from an update response)
 * into the view model the profile screens use: unwraps { profile }, adds the
 * fixed country, and normalizes the avatar URL. Pure (F14).
 */
export function formatProfile(data) {
  if (!data) return null
  const profile = data.profile ?? data
  return {
    ...profile,
    country: 'Vietnam',
    avatarUrl: getAvatarUrl(profile.avatarUrl),
  }
}
