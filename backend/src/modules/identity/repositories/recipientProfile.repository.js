import { RecipientProfile } from "../models/RecipientProfile.js";

/**
 * Inserts a RecipientProfile linked to a User by userId. userName is uniquely
 * indexed; a clash surfaces as a Mongo E11000 for the service to map.
 */
export async function create(profileData) {
  return RecipientProfile.create(profileData);
}

/**
 * Fetches the RecipientProfile owned by a given userId (uniquely indexed).
 * Returns null if none exists.
 */
export async function findByUserId(userId, options = {}) {
  const query = RecipientProfile.findOne({ userId });
  if (options.session) query.session(options.session);
  return query;
}

/** Fetches a RecipientProfile by its public profile id. */
export async function findById(recipientProfileId, options = {}) {
  const query = RecipientProfile.findById(recipientProfileId);
  if (options.session) query.session(options.session);
  return query;
}

/** Batch-fetches RecipientProfiles so cross-module callers avoid N+1 reads. */
export async function findByIds(recipientProfileIds, options = {}) {
  const query = RecipientProfile.find({ _id: { $in: recipientProfileIds } });
  if (options.session) query.session(options.session);
  return query;
}

/**
 * Batch fetch of RecipientProfiles for a page of userIds (Admin account
 * listing) — one $in query instead of one findByUserId per row.
 */
export async function findByUserIds(userIds) {
  return RecipientProfile.find({ userId: { $in: userIds } });
}

/**
 * Applies a partial patch to the RecipientProfile owned by userId, returning the
 * updated document. `runValidators` is required because Mongoose skips schema
 * validators on findOneAndUpdate by default. A duplicate userName surfaces as a
 * Mongo E11000 for the service to map. Returns null if no profile matches.
 */
export async function updateByUserId(userId, patch) {
  return RecipientProfile.findOneAndUpdate({ userId }, patch, {
    returnDocument: "after",
    runValidators: true,
  });
}

/**
 * Atomically flips a recipient to premium with `newExpiryDate`, but ONLY if the
 * profile is not already an ACTIVE premium (active = `isPremium` true AND
 * `premiumExpiryDate` still in the future). The "not active" guard lives in the
 * filter, so concurrent or duplicated subscribe calls can't both succeed:
 * MongoDB re-evaluates the filter under the per-document write lock, so the
 * second caller matches nothing and gets `null`. This is the idempotency + race
 * guard for premium billing (a stale `isPremium` flag on an expired date still
 * counts as inactive and is allowed to re-subscribe). Returns the updated
 * document, or `null` when already active (or no such profile).
 */
/**
 * Activates/extends premium for a card payment, exactly once per Stripe session.
 * The `lastPremiumSessionId !== stripeSessionId` guard lives in the filter, so a
 * re-delivered webhook for the same session matches nothing and returns null —
 * no double extension, even under concurrent redelivery. Returns the updated
 * document, or null if this session was already applied (or no such profile).
 */
export async function activatePremiumForPayment(
  userId,
  newExpiryDate,
  stripeSessionId,
  options = {},
) {
  return RecipientProfile.findOneAndUpdate(
    { userId, lastPremiumSessionId: { $ne: stripeSessionId } },
    {
      isPremium: true,
      premiumExpiryDate: newExpiryDate,
      lastPremiumSessionId: stripeSessionId,
    },
    { returnDocument: "after", runValidators: true, session: options.session },
  );
}

export async function activatePremiumIfInactive(
  userId,
  newExpiryDate,
  now = new Date(),
  options = {},
) {
  return RecipientProfile.findOneAndUpdate(
    {
      userId,
      $or: [
        { isPremium: { $ne: true } },
        { premiumExpiryDate: null },
        { premiumExpiryDate: { $lte: now } },
      ],
    },
    { isPremium: true, premiumExpiryDate: newExpiryDate },
    { returnDocument: "after", runValidators: true, session: options.session },
  );
}
