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
async function findProfileForUser(user) {
  if (user.role === userRole.Recipient) {
    return recipientProfileRepository.findByUserId(user._id);
  }
  if (user.role === userRole.Donor) {
    return donorProfileRepository.findByUserId(user._id);
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
 */
export async function getAccountById(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(`Account ${userId} not found`);
  }
  const profile = await findProfileForUser(user);
  return toAccountSummaryDTO(user, profile);
}

/**
 * Shared guard for deactivate/reactivate: loads the user, rejects Admin
 * targets (SRS 7.2.1 only covers Recipient/Donor accounts), and rejects a
 * no-op transition -- same style as donorListing.service.changeDonationStatus
 * rejecting an invalid status transition.
 */
async function transitionAccountStatus(userId, targetStatus) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(`Account ${userId} not found`);
  }
  if (user.role === userRole.Admin) {
    throw new ForbiddenError("Admin accounts cannot be deactivated or reactivated");
  }
  if (user.accountStatus === targetStatus) {
    throw new ConflictError(`Account is already ${targetStatus}`);
  }

  const updated = await userRepository.updateAccountStatus(userId, targetStatus);
  const profile = await findProfileForUser(updated);
  return toAccountSummaryDTO(updated, profile);
}

/** Deactivates a Recipient or Donor account (SRS 7.2.1). Blocks login until reactivated. */
export async function deactivateAccount(userId) {
  return transitionAccountStatus(userId, AccountStatus.Deactivated);
}

/** Reactivates a previously deactivated Recipient or Donor account (SRS 7.2.1). */
export async function reactivateAccount(userId) {
  return transitionAccountStatus(userId, AccountStatus.Active);
}
