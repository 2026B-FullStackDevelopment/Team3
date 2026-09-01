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
export async function findByUserId(userId) {
  return RecipientProfile.findOne({ userId });
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
