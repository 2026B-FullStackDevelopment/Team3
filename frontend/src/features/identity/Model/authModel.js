/**
 * Shapes GET /api/auth/me into the session user view model. Unwraps the { user }
 * envelope and exposes a friendlier joinedAt alias. Pure (F14 / FE_ARCHITECTURE §6.2).
 */
export function formatAuthUser(data) {
  if (!data) return null
  const user = data.user ?? data
  return {
    ...user,
    joinedAt: user.createdAt ?? null,
  }
}
