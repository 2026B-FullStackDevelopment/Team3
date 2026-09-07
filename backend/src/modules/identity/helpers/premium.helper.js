/**
 * Premium status helpers for RecipientProfile.
 *
 * Premium expiry is lazy: the stored `isPremium` boolean can go stale (it stays
 * true after the expiry date passes, since nothing sweeps it). `isPremiumActive`
 * is the single source of truth — a profile is premium only while its
 * `premiumExpiryDate` is still in the future.
 */

/** True only if the profile is flagged premium AND its expiry is still in the future. */
export function isPremiumActive(profile, now = new Date()) {
  return Boolean(
    profile?.isPremium &&
      profile.premiumExpiryDate &&
      new Date(profile.premiumExpiryDate) > now,
  );
}

/**
 * The new premium expiry after buying `months` of premium. Stacks onto the
 * remaining time if still active; otherwise starts from `now`. Pure/testable.
 */
export function nextExpiry(profile, now = new Date(), months = 1) {
  const current = profile?.premiumExpiryDate
    ? new Date(profile.premiumExpiryDate)
    : null;
  const base = current && current > now ? current : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}
