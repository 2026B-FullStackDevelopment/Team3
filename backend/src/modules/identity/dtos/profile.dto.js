import { userRole } from "../models/User.js";

/**
 * Maps a User + its role-specific profile to the safe shape returned across a
 * profile route response. Combines the shared User fields with the role's own
 * profile fields; never returns a raw Mongoose doc (DTO-at-every-boundary).
 *
 * `passwordHash` is already hidden (`select: false`) on User, so nothing
 * sensitive is present here — but we still shape explicitly rather than
 * spreading the docs.
 */
export function toProfileDTO(user, profile) {
  const base = {
    id: user._id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };

  if (user.role === userRole.Recipient) {
    return {
      ...base,
      userName: profile.userName,
      city: profile.city ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      isPremium: profile.isPremium,
      premiumExpiryDate: profile.premiumExpiryDate ?? null,
    };
  }

  return {
    ...base,
    companyName: profile.companyName ?? null,
    taxCode: profile.taxCode,
    city: profile.city ?? null,
    address: profile.address ?? null,
    location: profile.location ?? null,
    avatarUrl: profile.avatarUrl ?? null,
  };
}
