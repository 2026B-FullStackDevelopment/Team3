/**
 * Premium Model — pure formatter (F14 / FE_ARCHITECTURE §6.2). Maps GET /api/profile
 * (or the subscribe response) into the subscription view-model. No httpClient, no React.
 */
export function formatSubscription(data) {
  const profile = data?.profile ?? data
  if (!profile) return { isPremium: false, expiryDate: null }
  return {
    isPremium: Boolean(profile.isPremium),
    expiryDate: profile.premiumExpiryDate ?? null,
  }
}
