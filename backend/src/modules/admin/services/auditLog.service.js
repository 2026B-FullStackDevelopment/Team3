import mongoose from "mongoose";
import * as auditLogRepository from "../repositories/auditLog.repository.js";
import { AdminActionType, AuditTargetType, AuditLogStatus } from "../models/AuditLog.js";
import { NotFoundError, ValidationError, ConflictError, NotImplementedError } from "../../../shared/errors/errors.js";
import { env } from "../../../config/env.js";
// Cross-module calls go through each module's public facade/interface only
// (SRS A.3.1) -- never that module's Service layer directly.
import * as identity from "../../identity/index.js";
import * as donation from "../../donation/interfaces/donorListing.interface.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Maps a Mongoose AuditLog doc to the plain shape this service hands back
 * to callers, per SRS A.3.2 (responses must go through a DTO rather than
 * leaking a raw Mongoose document). previousState has nothing sensitive to
 * strip -- audit entries are admin-only -- so this is just a clean reshape,
 * not a redaction.
 */
function toAuditLogDTO(doc) {
  return {
    id: doc._id,
    adminId: doc.adminId,
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId,
    previousState: doc.previousState,
    status: doc.status,
    undoDeadline: doc.undoDeadline,
    undoneBy: doc.undoneBy,
    undoneAt: doc.undoneAt,
    createdAt: doc.createdAt,
  };
}

/**
 * Batch-fetches the acting admin's email for a page of AuditLog entries and
 * stitches it on as `adminEmail`, the same join shape as `listAllFoodListings`
 * stitching `donorName` onto listings (2026-09-07) -- AuditLog only stores
 * `adminId`, and Users have no username field (Admins included), so email
 * is the only real identifying value there is to join in.
 */
async function withAdminEmails(entries) {
  const uniqueAdminIds = [...new Set(entries.map((entry) => entry.adminId))];
  const admins = await identity.getUsersByIds(uniqueAdminIds);
  const emailByAdminId = new Map(admins.map((admin) => [admin._id, admin.email]));
  return entries.map((entry) => ({ ...entry, adminEmail: emailByAdminId.get(entry.adminId) ?? null }));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates and persists a new audit log entry. Only checks shape (required
 * fields present, enums valid) -- it does NOT verify adminId/targetId refer
 * to real records. That verification already happened one step earlier,
 * when AdminService called the target module's own interface (e.g.
 * IUserService.deactivateAccount) to perform the action; re-checking here
 * would just re-prove something already proven, and risks rejecting a
 * legitimate log entry if the target is deleted in the tiny window between
 * the action and the log write.
 *
 * `input.status` defaults to Pending (the schema default) but callers may
 * pass Finalized directly for an action that has no undo path at all --
 * see cancelDonation below -- so the entry never sits in a Pending state
 * with a live-looking undo window it can't actually honor.
 *
 * `options.session` lets the caller (the three action functions below) fold
 * this write into the same Mongo transaction as the mutation it's logging,
 * so a failure here rolls back the mutation too instead of leaving an
 * unlogged change.
 */
export async function createAuditLog(input, options = {}) {
  const { adminId, action, targetType, targetId, previousState, undoDeadline, status } = input;

  if (!isNonEmptyString(adminId)) {
    throw new ValidationError("adminId is required");
  }
  if (!Object.values(AdminActionType).includes(action)) {
    throw new ValidationError(`action must be one of: ${Object.values(AdminActionType).join(", ")}`);
  }
  if (!Object.values(AuditTargetType).includes(targetType)) {
    throw new ValidationError(`targetType must be one of: ${Object.values(AuditTargetType).join(", ")}`);
  }
  if (!isNonEmptyString(targetId)) {
    throw new ValidationError("targetId is required");
  }
  if (previousState === undefined) {
    throw new ValidationError("previousState is required");
  }

  let normalizedStatus = AuditLogStatus.Pending;
  if (status !== undefined) {
    if (!Object.values(AuditLogStatus).includes(status)) {
      throw new ValidationError(`status must be one of: ${Object.values(AuditLogStatus).join(", ")}`);
    }
    normalizedStatus = status;
  }

  let normalizedUndoDeadline;
  if (undoDeadline !== undefined && undoDeadline !== null) {
    const deadline = new Date(undoDeadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new ValidationError("undoDeadline must be a valid date");
    }
    if (deadline.getTime() <= Date.now()) {
      throw new ValidationError("undoDeadline must be in the future");
    }
    normalizedUndoDeadline = deadline;
  }

  const created = await auditLogRepository.create(
    {
      adminId,
      action,
      targetType,
      targetId,
      previousState,
      status: normalizedStatus,
      ...(normalizedUndoDeadline !== undefined && { undoDeadline: normalizedUndoDeadline }),
    },
    options,
  );

  return toAuditLogDTO(created);
}

/**
 * Fetches one audit log entry by id. Throws NotFoundError instead of
 * returning null so callers get an explicit, typed signal rather than each
 * having to re-check for a missing entry themselves.
 */
export async function getAuditLogById(id) {
  if (!isNonEmptyString(id)) {
    throw new ValidationError("id is required");
  }

  const entry = await auditLogRepository.findById(id);
  if (!entry) {
    throw new NotFoundError(`Audit log ${id} not found`);
  }

  return toAuditLogDTO(entry);
}

function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

function normalizeLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

/**
 * Lists audit log entries with filtering/pagination. The repository does a
 * raw pass-through of whatever it's given (no page/limit clamping, no enum
 * checks), so that normalization belongs here at the business layer: an
 * unrecognized status/targetType should fail loudly instead of silently
 * returning zero rows, and page/limit need sane defaults and an upper cap.
 *
 * `search` matches by the acting admin's email (the only real identifying
 * field a User has -- see withAdminEmails above) -- resolved to a set of
 * adminIds via identity.findAdminIdsByEmailLike *before* querying AuditLog,
 * same "resolve name -> ids first, short-circuit if zero matches" shape as
 * listAllFoodListings' donorName search, for the same reason: querying with
 * an empty $in would either waste a query or (depending on how the query
 * got built) behave like no filter at all and wrongly return every entry.
 */
export async function listAuditLogs(filters = {}) {
  const { targetType, status, adminId, search, startDate, endDate, page, limit } = filters;

  if (targetType !== undefined && !Object.values(AuditTargetType).includes(targetType)) {
    throw new ValidationError(`targetType must be one of: ${Object.values(AuditTargetType).join(", ")}`);
  }
  if (status !== undefined && !Object.values(AuditLogStatus).includes(status)) {
    throw new ValidationError(`status must be one of: ${Object.values(AuditLogStatus).join(", ")}`);
  }

  let normalizedStart;
  let normalizedEnd;
  if (startDate !== undefined) {
    normalizedStart = new Date(startDate);
    if (Number.isNaN(normalizedStart.getTime())) {
      throw new ValidationError("startDate must be a valid date");
    }
  }
  if (endDate !== undefined) {
    normalizedEnd = new Date(endDate);
    if (Number.isNaN(normalizedEnd.getTime())) {
      throw new ValidationError("endDate must be a valid date");
    }
  }
  if (normalizedStart && normalizedEnd && normalizedStart > normalizedEnd) {
    throw new ValidationError("startDate must not be after endDate");
  }

  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);

  let adminIds;
  if (isNonEmptyString(search)) {
    adminIds = await identity.findAdminIdsByEmailLike(search);
    if (adminIds.length === 0) {
      return { entries: [], total: 0, page: normalizedPage, limit: normalizedLimit };
    }
  }

  const { entries, total } = await auditLogRepository.findAll({
    targetType,
    status,
    adminId,
    adminIds,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    page: normalizedPage,
    limit: normalizedLimit,
  });

  return {
    entries: await withAdminEmails(entries.map(toAuditLogDTO)),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

/**
 * Attempts to undo a Pending admin action within its undo window.
 * Validates the entry is actually undoable (still Pending, deadline not
 * passed) before anything else, since that check is real regardless of
 * what undo eventually does.
 *
 * DeactivateUser and ReactivateUser are genuinely invertible -- undoing one
 * is just calling the identity facade's opposite method -- so those revert
 * for real here, inside a transaction with the AuditLog status flip, so a
 * failed revert never gets recorded as a successful undo. CancelDonation
 * has no inverse anywhere in the SRS (no "un-cancel a listing" feature), so
 * cancelDonation() below never creates a Pending entry for it in the first
 * place; the `else` branch here is a defensive guard for a state that
 * should be unreachable, not a real code path.
 */
export async function undoAction(auditLogId, actorId) {
  if (!isNonEmptyString(auditLogId)) {
    throw new ValidationError("auditLogId is required");
  }
  if (!isNonEmptyString(actorId)) {
    throw new ValidationError("actorId is required");
  }

  const entry = await getAuditLogById(auditLogId);

  if (entry.status !== AuditLogStatus.Pending) {
    throw new ConflictError(`Audit log ${auditLogId} is ${entry.status}, not Pending -- it can no longer be undone`);
  }
  if (!entry.undoDeadline || new Date(entry.undoDeadline).getTime() <= Date.now()) {
    throw new ConflictError(`Audit log ${auditLogId}'s undo window has expired`);
  }

  const session = await mongoose.startSession();
  try {
    let reverted;
    await session.withTransaction(async () => {
      if (entry.action === AdminActionType.DeactivateUser) {
        reverted = await identity.reactivateAccount(entry.targetId, { session });
      } else if (entry.action === AdminActionType.ReactivateUser) {
        reverted = await identity.deactivateAccount(entry.targetId, { session });
      } else {
        throw new NotImplementedError(`Undo is not available for ${entry.action}`);
      }

      await auditLogRepository.updateStatus(
        entry.id,
        AuditLogStatus.Undone,
        new Date(),
        actorId,
        { session },
      );
    });
    return reverted;
  } finally {
    await session.endSession();
  }
}

/**
 * Sweeps Pending entries whose undo window has passed and finalizes them.
 * Meant to be called by a scheduled job (see the Scheduled Job Worker in
 * the architecture diagram), not a user-facing route -- wiring an actual
 * cron trigger for it is a separate task.
 */
export async function finalizeExpiredEntries() {
  const expired = await auditLogRepository.findExpiredPending();

  const finalized = await Promise.all(
    expired.map((entry) => auditLogRepository.updateStatus(entry._id, AuditLogStatus.Finalized))
  );

  return finalized.map(toAuditLogDTO);
}

// --- SRS 7.1.1, 7.2.1, 7.2.2 ------------------------------------------------
// The three admin actions below all go through the same shape: read the
// target's current state through its module's facade (for previousState),
// perform the mutation through that same facade, then log it here with an
// undo window. Listing accounts is a read, not an action, so it skips the
// audit log entirely.

function computeUndoDeadline() {
  return new Date(Date.now() + env.admin.undoWindowMs);
}

/**
 * Paginated list of Recipient/Donor accounts for the Admin UI (SRS 7.1.1).
 * Pure passthrough to Identity's facade -- nothing here is Admin-module
 * business logic, so there's no reason to duplicate validation that
 * identity.listAccounts already does.
 */
export async function listAccounts(filters = {}) {
  return identity.listAccounts(filters);
}

/**
 * Deactivates a Recipient or Donor account and logs it (SRS 7.2.1).
 * The read of the pre-change state, the mutation, and the audit-log write
 * all run inside one Mongo transaction: if createAuditLog fails, the whole
 * thing rolls back instead of leaving a real change with no audit record
 * (and no undo deadline) behind it.
 */
export async function deactivateUserAccount(adminId, userId) {
  if (!isNonEmptyString(adminId)) {
    throw new ValidationError("adminId is required");
  }
  if (!isNonEmptyString(userId)) {
    throw new ValidationError("userId is required");
  }

  const session = await mongoose.startSession();
  try {
    let after;
    await session.withTransaction(async () => {
      const before = await identity.getAccountById(userId, { session });
      after = await identity.deactivateAccount(userId, { session });

      await createAuditLog(
        {
          adminId,
          action: AdminActionType.DeactivateUser,
          targetType: AuditTargetType.User,
          targetId: userId,
          previousState: before,
          undoDeadline: computeUndoDeadline(),
        },
        { session },
      );
    });
    return after;
  } finally {
    await session.endSession();
  }
}

/**
 * Reactivates a previously deactivated Recipient or Donor account and logs
 * it (SRS 7.2.1). Same single-transaction shape as deactivateUserAccount.
 */
export async function reactivateUserAccount(adminId, userId) {
  if (!isNonEmptyString(adminId)) {
    throw new ValidationError("adminId is required");
  }
  if (!isNonEmptyString(userId)) {
    throw new ValidationError("userId is required");
  }

  const session = await mongoose.startSession();
  try {
    let after;
    await session.withTransaction(async () => {
      const before = await identity.getAccountById(userId, { session });
      after = await identity.reactivateAccount(userId, { session });

      await createAuditLog(
        {
          adminId,
          action: AdminActionType.ReactivateUser,
          targetType: AuditTargetType.User,
          targetId: userId,
          previousState: before,
          undoDeadline: computeUndoDeadline(),
        },
        { session },
      );
    });
    return after;
  } finally {
    await session.endSession();
  }
}

/**
 * Lists all active food listings system-wide with each one's Donor Name
 * attached (SRS 7.3.1). `search` matches EITHER the listing's own name
 * (grocery name) OR the donor's company name (account name) -- one box,
 * SRS 7.3.2's "search by Donor Name ... " read as an OR, not an AND, with
 * the grocery name match the donation module already supports. Plus exact
 * donorProfileId/donationId filters, unrelated to the `search` box.
 *
 * Donor Name lives in the identity module (DonorProfile.companyName) but a
 * food listing only stores donorProfileId, so the search-by-name
 * resolution and the display join both happen here rather than inside the
 * donation module, which has no reason to know what a DonorProfile's
 * company name is. Unlike a donor-name-only search, a search term that
 * matches zero donors does NOT short-circuit to empty results here -- the
 * listing-name half of the OR might still match, so donation.
 * listActiveListingsForAdmin always runs.
 */
export async function listAllFoodListings(filters = {}) {
  const { search, donorProfileId, donationId, page, limit } = filters;

  let searchDonorProfileIds;
  if (isNonEmptyString(search)) {
    searchDonorProfileIds = await identity.findDonorProfileIdsByName(search);
  }

  const { entries, total, page: resolvedPage, limit: resolvedLimit } =
    await donation.listActiveListingsForAdmin({
      page,
      limit,
      donationId,
      donorProfileId,
      search,
      searchDonorProfileIds,
    });

  const uniqueDonorProfileIds = [...new Set(entries.map((entry) => entry.donorProfileId))];
  const donorProfiles = await identity.getDonorProfilesByIds(uniqueDonorProfileIds);
  const donorNameById = new Map(donorProfiles.map((profile) => [profile._id, profile.companyName]));

  return {
    listings: entries.map((entry) => {
      const summary = donation.toDonationSummaryDTO(entry);
      return { ...summary, donorName: donorNameById.get(summary.donorProfileId) ?? null };
    }),
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  };
}

/**
 * Cancels any Active food listing and logs it (SRS 7.2.2). Same
 * single-transaction shape as the two account actions above -- the
 * transaction also covers adminCancelDonation's own internal listing +
 * reservations writes, since it accepts and joins this same session instead
 * of opening its own.
 *
 * Logged straight to Finalized, with no undoDeadline: there is no
 * "un-cancel a listing" feature anywhere in the SRS, so this action has no
 * real inverse. Giving it a live undo window would let the Admin UI offer
 * an undo button that can never do anything but 501.
 */
export async function cancelDonation(adminId, donationId) {
  if (!isNonEmptyString(adminId)) {
    throw new ValidationError("adminId is required");
  }
  if (!isNonEmptyString(donationId)) {
    throw new ValidationError("donationId is required");
  }

  const session = await mongoose.startSession();
  try {
    let after;
    await session.withTransaction(async () => {
      const beforeDonation = await donation.readDonationById(donationId, { session });
      const before = donation.toDonationSummaryDTO(beforeDonation);
      after = await donation.adminCancelDonation(donationId, { session });

      await createAuditLog(
        {
          adminId,
          action: AdminActionType.CancelDonation,
          targetType: AuditTargetType.Donation,
          targetId: donationId,
          previousState: before,
          status: AuditLogStatus.Finalized,
        },
        { session },
      );
    });
    return after;
  } finally {
    await session.endSession();
  }
}
