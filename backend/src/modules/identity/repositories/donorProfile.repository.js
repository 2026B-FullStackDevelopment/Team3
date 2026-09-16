import { DonorProfile } from "../models/DonorProfile.js";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

/** Fetches a DonorProfile by its profile id. */
export async function findById(donorProfileId, options = {}) {
  const query = DonorProfile.findById(donorProfileId);
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
 * Batch fetch of DonorProfiles by their own _id (not userId) -- used by the
 * Admin module to join company names onto its food-listing views (SRS
 * 7.3.1/7.3.2), which only have donorProfileId to work with.
 */
export async function findByIds(ids, options = {}) {
  const query = DonorProfile.find({ _id: { $in: ids } });
  if (options.session) query.session(options.session);
  return query;
}

/** Returns donor profile ids in one exact Vietnamese municipality/city. */
export async function findIdsByCity(city, options = {}) {
  const query = DonorProfile.find({ city }).select("_id");
  if (options.session) query.session(options.session);
  const profiles = await query;
  return profiles.map((profile) => profile._id);
}

/**
 * Finds DonorProfile ids whose companyName matches a case-insensitive,
 * substring search -- SRS 7.3.2's "search by Donor Name", same
 * case-insensitive/pattern-based style as the donation module's own name
 * search (donorListing.repository.buildDonationQuery).
 */
export async function findIdsByCompanyNameLike(namePattern) {
  const trimmedPattern = String(namePattern).trim();
  const regex = new RegExp(escapeRegExp(trimmedPattern), "i");
  const profiles = await DonorProfile.find({ companyName: regex }).select(
    "_id",
  );
  return profiles.map((profile) => profile._id);
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
