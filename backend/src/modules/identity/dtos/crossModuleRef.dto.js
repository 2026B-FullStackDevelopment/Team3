/**
 * Cross-module ref DTOs — the minimal shapes Identity hands to OTHER modules
 * through its facade (index.js), per SRS A.3.2 (present only necessary data).
 * They deliberately strip everything else: DonorProfile.taxCode/address/location,
 * RecipientProfile premium/city fields, and the rest of the User document.
 *
 * `_id` is preserved on purpose so existing consumers (e.g. Admin reading
 * `profile._id`) need no changes.
 */

/** DonorProfile -> { _id, userId, companyName } | null */
export function toDonorProfileRefDTO(profile) {
  if (!profile) return null;
  return {
    _id: profile._id,
    userId: profile.userId,
    companyName: profile.companyName,
  };
}

/** RecipientProfile -> { _id, userId } | null */
export function toRecipientProfileRefDTO(profile) {
  if (!profile) return null;
  return {
    _id: profile._id,
    userId: profile.userId,
  };
}

/** Donor location fields needed for listing matching and proximity ordering. */
export function toDonorLocationRefDTO(profile) {
  if (!profile) return null;
  return {
    donorProfileId: String(profile._id),
    city: profile.city ?? null,
    location: profile.location
      ? {
          type: profile.location.type,
          coordinates: [...profile.location.coordinates],
        }
      : null,
  };
}

/** Active Premium Recipient reference used for notification fan-out. */
export function toPremiumRecipientRefDTO(profile) {
  if (!profile) return null;
  return {
    recipientProfileId: String(profile._id),
    userId: String(profile.userId),
  };
}

/** User -> { _id, email } | null */
export function toUserContactDTO(user) {
  if (!user) return null;
  return {
    _id: user._id,
    email: user.email,
  };
}
