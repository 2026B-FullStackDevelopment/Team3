import { DonorProfile } from "../models/DonorProfile.js";

/**
 * Inserts a DonorProfile linked to a User by userId. taxCode is uniquely
 * indexed; a clash surfaces as a Mongo E11000 for the service to map.
 */
export async function create(profileData) {
  return DonorProfile.create(profileData);
}
