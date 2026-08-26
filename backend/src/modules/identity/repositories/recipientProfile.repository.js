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
