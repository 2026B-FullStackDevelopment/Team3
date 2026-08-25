import { User } from "../models/User.js";

/**
 * True if a User already exists with this email. Email is uniquely indexed,
 * so this is an indexed point lookup. Caller passes an already-normalized
 * (lowercased/trimmed) email.
 */
export async function existsByEmail(email) {
  const found = await User.exists({ email });
  return found !== null;
}

/**
 * Inserts a new User. Only auth fields live here; the schema owns defaults
 * (accountStatus: Active, failedLoginAttempts: 0). Caller supplies the
 * already-hashed passwordHash — this layer never sees plaintext.
 */
export async function create(userData) {
  return User.create(userData);
}

/**
 * Hard-deletes a User by _id. Used to roll back a just-created account when a
 * follow-up step (e.g. profile creation) fails, so we don't orphan accounts.
 */
export async function deleteById(id) {
  return User.findByIdAndDelete(id);
}
