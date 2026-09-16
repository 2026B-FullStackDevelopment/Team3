import { userRole, AccountStatus } from "../models/User.js";
import * as userRepository from "../repositories/user.repository.js";
import * as donorProfileRepository from "../repositories/donorProfile.repository.js";
import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import { toAccountSummaryDTO } from "../dtos/accountSummary.dto.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";

/**
 * Admin-only account management (SRS 7.1.1, 7.2.1) -- separate from
 * auth.service.js (login/registration) and profile.service.js (self-service
 * profile edits), since "an Admin managing someone else's account" is a
 * different concern from either of those.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const LISTABLE_ROLES = [userRole.Recipient, userRole.Donor];

function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

function normalizeLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

/** Looks up the profile matching a user's role; Admins have no profile row. */
async function findProfileForUser(user, options = {}) {
  if (user.role === userRole.Recipient) {
    return recipientProfileRepository.findByUserId(user._id, options);
  }
  if (user.role === userRole.Donor) {
    return donorProfileRepository.findByUserId(user._id, options);
  }
  return null;
}

/**
 * Paginated Admin account listing (SRS 7.1.1). Always restricted to
 * Recipient/Donor -- Admin accounts are never listed here, matching the SRS
 * wording ("see all Recipients and Donors"). An explicit `role` filter must
 * itself be Recipient or Donor.
 */
export async function listAccounts(filters = {}) {
  const { role, page, limit } = filters;

  let roles = LISTABLE_ROLES;
  if (role !== undefined) {
    if (!LISTABLE_ROLES.includes(role)) {
      throw new ValidationError(`role must be one of: ${LISTABLE_ROLES.join(", ")}`);
    }
    roles = [role];
  }

  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);

  const { entries, total } = await userRepository.findAll({
    roles,
    page: normalizedPage,
    limit: normalizedLimit,
  });

  const userIds = entries.map((user) => user._id);
  const [donorProfiles, recipientProfiles] = await Promise.all([
    donorProfileRepository.findByUserIds(userIds),
    recipientProfileRepository.findByUserIds(userIds),
  ]);

  const profileByUserId = new Map(
    [...donorProfiles, ...recipientProfiles].map((profile) => [profile.userId, profile]),
  );

  return {
    accounts: entries.map((user) =>
      toAccountSummaryDTO(user, profileByUserId.get(user._id)),
    ),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

/**
 * Fetches one account by id, DTO-shaped. Used both directly and by the Admin
 * module to snapshot "previous state" before deactivating/reactivating.
 * Accepts an optional Mongo session so that snapshot read can join the same
 * transaction as the mutation and audit-log write that follow it.
 */
export async function getAccountById(userId, options = {}) {
  const user = await userRepository.findById(userId, options);
  if (!user) {
    throw new NotFoundError(`Account ${userId} not found`);
  }
  const profile = await findProfileForUser(user, options);
  return toAccountSummaryDTO(user, profile);
}

/**
 * Shared guard for deactivate/reactivate: loads the user, rejects Admin
 * targets (SRS 7.2.1 only covers Recipient/Donor accounts), and rejects a
 * no-op transition -- same style as donorListing.service.changeDonationStatus
 * rejecting an invalid status transition. Threads an optional session through
 * every read/write so a caller (e.g. the Admin module) can make this part of
 * a larger all-or-nothing transaction with its own audit-log write.
 */
async function transitionAccountStatus(userId, targetStatus, options = {}) {
  const user = await userRepository.findById(userId, options);
  if (!user) {
    throw new NotFoundError(`Account ${userId} not found`);
  }
  if (user.role === userRole.Admin) {
    throw new ForbiddenError("Admin accounts cannot be deactivated or reactivated");
  }
  if (user.accountStatus === targetStatus) {
    throw new ConflictError(`Account is already ${targetStatus}`);
  }

  const updated = await userRepository.updateAccountStatus(userId, targetStatus, options);
  const profile = await findProfileForUser(updated, options);
  return toAccountSummaryDTO(updated, profile);
}

/** Deactivates a Recipient or Donor account (SRS 7.2.1). Blocks login until reactivated. */
export async function deactivateAccount(userId, options = {}) {
  return transitionAccountStatus(userId, AccountStatus.Deactivated, options);
}

/** Reactivates a previously deactivated Recipient or Donor account (SRS 7.2.1). */
export async function reactivateAccount(userId, options = {}) {
  return transitionAccountStatus(userId, AccountStatus.Active, options);
}

/**
 * Batch-fetches DonorProfiles by their own id (not a User account), for the
 * Admin module to join company names onto its food-listing views (SRS
 * 7.3.1/7.3.2). Kept separate from listAccounts/getAccountById since a
 * DonorProfile isn't a User account -- this is "look up a donor's public
 * info," not "manage a user's account."
 */
export async function getDonorProfilesByIds(donorProfileIds, options = {}) {
  return donorProfileRepository.findByIds(donorProfileIds, options);
}

/** Finds DonorProfile ids whose companyName matches a search term (SRS 7.3.2). */
export async function findDonorProfileIdsByName(namePattern) {
  return donorProfileRepository.findIdsByCompanyNameLike(namePattern);
}

/**
 * Batch-fetches Users by id, for the Admin module to join the acting
 * admin's email onto Audit Log entries (SRS §8). Users have no username
 * field (see the 2026-09-01 entry on why the Admin account listing's
 * "Username" column already has to fall back per-role) -- email is the
 * only real identifying field a User (Admin included) actually has.
 */
export async function getUsersByIds(userIds, options = {}) {
  return userRepository.findByIds(userIds, options);
}

/** Finds Admin user ids whose email matches a search term (audit log search). */
export async function findAdminIdsByEmailLike(emailPattern) {
  return userRepository.findAdminIdsByEmailLike(emailPattern);
}

/**
 * Batch-fetches account summaries (same username/companyName-fallback shape
 * as listAccounts/getAccountById) by user id, for the Admin module to join a
 * display name onto a "User"-type Audit Log target (SRS §8) -- reuses
 * listAccounts' own profile-batching, just for an arbitrary id list instead
 * of a role-filtered page.
 */
export async function getAccountSummariesByIds(userIds, options = {}) {
  const users = await userRepository.findByIds(userIds, options);
  const [donorProfiles, recipientProfiles] = await Promise.all([
    donorProfileRepository.findByUserIds(userIds),
    recipientProfileRepository.findByUserIds(userIds),
  ]);
  const profileByUserId = new Map(
    [...donorProfiles, ...recipientProfiles].map((profile) => [profile.userId, profile]),
  );
  return users.map((user) => toAccountSummaryDTO(user, profileByUserId.get(user._id)));
}
