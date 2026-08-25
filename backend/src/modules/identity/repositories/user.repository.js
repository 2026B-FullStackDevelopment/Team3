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
