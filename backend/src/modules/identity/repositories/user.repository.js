import { User } from "../models/User.js";
import { env } from "../../../config/env.js";

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

/**
 * Fetches a user by email for credential verification, explicitly including
 * the normally-hidden passwordHash. accountStatus, role, and lockout fields
 * come back by default — so login gets everything it needs in ONE query
 * (per the Auth rules). Email is uniquely indexed. Returns null if not found.
 */
export async function findByEmailWithSecret(email) {
  return User.findOne({ email }).select("+passwordHash");
}

/**
 * Fetches a user by _id. passwordHash stays hidden (select: false), so this is
 * safe to map straight to a DTO. Returns null if not found.
 */
export async function findById(id) {
  return User.findById(id);
}

/**
 * Fetches a user by _id with the normally-hidden passwordHash included, for
 * verifying the current password on a change-password request. Returns null if
 * not found.
 */
export async function findByIdWithSecret(id) {
  return User.findById(id).select("+passwordHash");
}

/**
 * Sets a new passwordHash on a user. Atomic single-field update; the caller
 * supplies the already-hashed value — this layer never sees plaintext.
 */
export async function updatePasswordHash(id, passwordHash) {
  return User.updateOne({ _id: id }, { $set: { passwordHash } });
}

/**
 * Records a failed login atomically: increments failedLoginAttempts, stamps
 * lastFailedLoginAt, and — in the SAME update — locks the account when the
 * (post-increment) count reaches the threshold. Uses an aggregation-pipeline
 * update so the increment and the conditional lock are one atomic operation,
 * never a read-modify-write in app code.
 */
export async function registerFailedAttempt(id) {
  return User.updateOne(
    { _id: id },
    [
      {
        $set: {
          failedLoginAttempts: { $add: ["$failedLoginAttempts", 1] },
          lastFailedLoginAt: "$$NOW",
        },
      },
      {
        $set: {
          lockedUntil: {
            $cond: [
              { $gte: ["$failedLoginAttempts", env.auth.lockoutThreshold] },
              { $add: ["$$NOW", env.auth.lockoutDurationMs] },
              "$lockedUntil",
            ],
          },
        },
      },
    ],
    // Mongoose 9 requires opting in to array (aggregation-pipeline) updates.
    { updatePipeline: true },
  );
}

/**
 * Clears the lockout state after a successful login: resets the failure
 * counter and unlocks. Atomic single-document update.
 */
export async function resetLockout(id) {
  return User.updateOne(
    { _id: id },
    {
      $set: { failedLoginAttempts: 0, lockedUntil: null, lastFailedLoginAt: null },
    },
  );
}

/**
 * Paginated list of Users restricted to the given roles (the Admin account
 * listing only ever asks for Recipient/Donor, never Admin). Runs find() and
 * countDocuments() concurrently via Promise.all, same as
 * donorListing.repository.findAll / auditLog.repository.findAll.
 */
export async function findAll({ roles, page = 1, limit = 20 } = {}) {
  const query = {};
  if (Array.isArray(roles) && roles.length > 0) {
    query.role = { $in: roles };
  }

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return { entries, total };
}

/**
 * Sets a user's accountStatus (Admin deactivate/reactivate). findByIdAndUpdate
 * is one atomic round-trip instead of findById() + save(), for the same
 * reason as auditLog.repository.updateStatus: no window where stale
 * in-memory state could overwrite a concurrent change.
 */
export async function updateAccountStatus(id, accountStatus) {
  return User.findByIdAndUpdate(id, { $set: { accountStatus } }, { new: true });
}
