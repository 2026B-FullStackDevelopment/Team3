import { DonorProfile } from "../models/DonorProfile.js";

/**
 * Inserts a DonorProfile linked to a User by userId. taxCode is uniquely
 * indexed; a clash surfaces as a Mongo E11000 for the service to map.
 */
export async function create(profileData) {
  return DonorProfile.create(profileData);
}

/**
 * Fetches the DonorProfile owned by a given userId (indexed). Returns null if
 * none exists.
 */
export async function findByUserId(userId, options = {}) {
  const query = DonorProfile.findOne({ userId });
  if (options.session) query.session(options.session);
  return query;
}

/**
 * Batch fetch of DonorProfiles for a page of userIds (Admin account listing) —
 * one $in query instead of one findByUserId per row.
 */
export async function findByUserIds(userIds) {
  return DonorProfile.find({ userId: { $in: userIds } });
}

/**
 * Applies a partial patch to the DonorProfile owned by userId, returning the
 * updated document. `runValidators` is required because Mongoose skips schema
 * validators on findOneAndUpdate by default (e.g. the GeoJSON location shape).
 * Returns null if no profile matches.
 */
export async function updateByUserId(userId, patch) {
  return DonorProfile.findOneAndUpdate({ userId }, patch, {
    returnDocument: "after",
    runValidators: true,
  });
}
