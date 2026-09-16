import mongoose from "mongoose";
import * as auditLogRepository from "../repositories/auditLog.repository.js";
import {
  AdminActionType,
  AuditTargetType,
  AuditLogStatus,
} from "../models/AuditLog.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  NotImplementedError,
} from "../../../shared/errors/errors.js";
import { env } from "../../../config/env.js";
// Cross-module calls go through each module's public facade/interface only
// (SRS A.3.1) -- never that module's Service layer directly.
import * as identity from "../../identity/index.js";
import * as donation from "../../donation/interfaces/donation.interface.js";
import * as reservation from "../../reservation/interfaces/reservation.interface.js";
import * as notification from "../../notification/interfaces/notification.interface.js";

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
  const emailByAdminId = new Map(
    admins.map((admin) => [admin._id, admin.email]),
  );
  return entries.map((entry) => ({
    ...entry,
    adminEmail: emailByAdminId.get(entry.adminId) ?? null,
  }));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Batch-resolves each entry's target display name for the Audit Log's
 * Target column. A "User" target's name is its account summary's username
 * (Recipient userName / Donor companyName fallback -- same shape
 * listAccounts/getAccountById already use). A "Donation" target's name is
 * its donor's company name, resolved via the listing's own donorProfileId --
 * the same donorName join listAllFoodListings does for Listing Moderation,
 * just keyed off a single historical donation instead of the active list.
 * A donation that no longer resolves (shouldn't happen -- donations are
 * status-flipped, never deleted) just falls back to a null name rather than
 * failing the whole page.
 */
async function withTargetNames(entries) {
  const userTargetIds = [
    ...new Set(
      entries
        .filter((entry) => entry.targetType === AuditTargetType.User)
        .map((entry) => entry.targetId),
    ),
  ];
  const donationTargetIds = [
    ...new Set(
      entries
        .filter((entry) => entry.targetType === AuditTargetType.Donation)
        .map((entry) => entry.targetId),
    ),
  ];

  const [accounts, donations] = await Promise.all([
    userTargetIds.length > 0
      ? identity.getAccountSummariesByIds(userTargetIds)
      : [],
    Promise.all(
      donationTargetIds.map((id) =>
        donation.readDonationById(id).catch(() => null),
      ),
    ),
  ]);

  const usernameByUserId = new Map(
    accounts.map((account) => [account.id, account.username ?? account.email]),
  );

  const resolvedDonations = donations.filter(Boolean);
  const donorProfileIds = [
    ...new Set(resolvedDonations.map((entry) => entry.donorProfileId)),
  ];
  const donorProfiles =
    donorProfileIds.length > 0
      ? await identity.getDonorProfilesByIds(donorProfileIds)
      : [];
  const donorNameByProfileId = new Map(
    donorProfiles.map((profile) => [profile._id, profile.companyName]),
  );
  const donorNameByDonationId = new Map(
    resolvedDonations.map((entry) => [
      entry.id,
      donorNameByProfileId.get(entry.donorProfileId) ?? null,
    ]),
  );

  return entries.map((entry) => {
    if (entry.targetType === AuditTargetType.User) {
      return { ...entry, targetName: usernameByUserId.get(entry.targetId) ?? null };
    }
    if (entry.targetType === AuditTargetType.Donation) {
      return {
        ...entry,
        targetName: donorNameByDonationId.get(entry.targetId) ?? null,
      };
    }
    return entry;
  });
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
 * pass Finalized directly for an action that has no undo path at all, so
 * the entry never sits in a Pending state with a live-looking undo window
 * it can't actually honor. All three action functions below currently do
 * have an undo path, so none of them use this today -- it's here for the
 * next action type that doesn't.
 *
 * `options.session` lets the caller (the three action functions below) fold
 * this write into the same Mongo transaction as the mutation it's logging,
 * so a failure here rolls back the mutation too instead of leaving an
 * unlogged change.
 */
export async function createAuditLog(input, options = {}) {
  const {
    adminId,
    action,
    targetType,
    targetId,
    previousState,
    undoDeadline,
    status,
  } = input;

  if (!isNonEmptyString(adminId)) {
    throw new ValidationError("adminId is required");
  }
  if (!Object.values(AdminActionType).includes(action)) {
    throw new ValidationError(
      `action must be one of: ${Object.values(AdminActionType).join(", ")}`,
    );
  }
  if (!Object.values(AuditTargetType).includes(targetType)) {
    throw new ValidationError(
      `targetType must be one of: ${Object.values(AuditTargetType).join(", ")}`,
    );
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
      throw new ValidationError(
        `status must be one of: ${Object.values(AuditLogStatus).join(", ")}`,
      );
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
      ...(normalizedUndoDeadline !== undefined && {
        undoDeadline: normalizedUndoDeadline,
      }),
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
export async function getAuditLogById(id, options = {}) {
  if (!isNonEmptyString(id)) {
    throw new ValidationError("id is required");
  }

  const entry = await auditLogRepository.findById(id, options);
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
  const {
    targetType,
    status,
    adminId,
    search,
    startDate,
    endDate,
    page,
    limit,
  } = filters;

  if (
    targetType !== undefined &&
    !Object.values(AuditTargetType).includes(targetType)
  ) {
    throw new ValidationError(
      `targetType must be one of: ${Object.values(AuditTargetType).join(", ")}`,
    );
  }
  if (status !== undefined && !Object.values(AuditLogStatus).includes(status)) {
    throw new ValidationError(
      `status must be one of: ${Object.values(AuditLogStatus).join(", ")}`,
    );
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
      return {
        entries: [],
        total: 0,
        page: normalizedPage,
        limit: normalizedLimit,
      };
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
    entries: await withTargetNames(
      await withAdminEmails(entries.map(toAuditLogDTO)),
    ),
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
 * never actually cancels anything at action time either -- cancelDonation()
 * below only puts the listing in PendingCancellation limbo -- so its undo is
 * just as symmetric: donation.reinstateDonation flips it back to Active. The
 * real cancellation (and its reservation cascade) only happens later, in
 * finalizeExpiredEntries, if undo never runs. The `else` branch here is a
 * defensive guard for any future action added without an undo path, not a
 * real code path today.
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
    throw new ConflictError(
      `Audit log ${auditLogId} is ${entry.status}, not Pending -- it can no longer be undone`,
    );
  }
  if (
    !entry.undoDeadline ||
    new Date(entry.undoDeadline).getTime() <= Date.now()
  ) {
    throw new ConflictError(
      `Audit log ${auditLogId}'s undo window has expired`,
    );
  }

  const session = await mongoose.startSession();
  try {
    let reverted;
    await session.withTransaction(async () => {
      const current = await auditLogRepository.findById(auditLogId, {
        session,
      });
      const now = new Date();
      if (
        !current ||
        current.status !== AuditLogStatus.Pending ||
        !current.undoDeadline ||
        current.undoDeadline.getTime() <= now.getTime()
      ) {
        throw new ConflictError(
          `Audit log ${auditLogId} can no longer be undone`,
        );
      }

      if (current.action === AdminActionType.DeactivateUser) {
        reverted = await identity.reactivateAccount(current.targetId, {
          session,
        });
      } else if (current.action === AdminActionType.ReactivateUser) {
        reverted = await identity.deactivateAccount(current.targetId, {
          session,
        });
      } else if (current.action === AdminActionType.CancelDonation) {
        reverted = await donation.reinstateDonation(current.targetId, {
          session,
        });
      } else {
        throw new NotImplementedError(
          `Undo is not available for ${current.action}`,
        );
      }

      const updatedAudit = await auditLogRepository.updatePendingStatus(
        current._id,
        AuditLogStatus.Undone,
        { undoneAt: now, undoneBy: actorId },
        { session },
      );
      if (!updatedAudit) {
        throw new ConflictError(
          `Audit log ${auditLogId} can no longer be undone`,
        );
      }
    });
    return reverted;
  } finally {
    await session.endSession();
  }
}

/**
 * Sweeps Pending entries whose undo window has passed and finalizes them.
 * Called by jobs/auditLogSweep.job.js on startup and once per configured
 * interval; this is an internal worker, not a user-facing route.
 *
 * Most actions (DeactivateUser, ReactivateUser) already took full effect at
 * action time, so finalizing one is just closing the audit record -- a
 * plain status flip. CancelDonation is different: it only put the listing
 * in PendingCancellation limbo, so finalizing it has to make the
 * cancellation real (donation.finalizeCancellation, which also runs the
 * reservation cascade) before the audit record can close, and that domain
 * mutation must succeed together with the status flip in one transaction --
 * same discipline as every other write in this file. That's why this loops
 * per entry instead of one Promise.all: a plain status flip and a
 * transaction-wrapped domain mutation aren't the same shape, and this sweep
 * runs on a low-frequency background timer (env.admin.sweepIntervalMs), not
 * a latency-sensitive path, so sequential is fine.
 */
export async function finalizeExpiredEntries() {
  const expired = await auditLogRepository.findExpiredPending({
    limit: env.admin.sweepBatchSize,
  });

  const finalized = [];
  for (const entry of expired) {
    if (entry.action === AdminActionType.CancelDonation) {
      const session = await mongoose.startSession();
      let createdNotifications = [];
      try {
        let updated;
        await session.withTransaction(async () => {
          // withTransaction may retry this callback after a transient error.
          // Never publish values captured by an aborted attempt.
          updated = undefined;
          createdNotifications = [];
          const now = new Date();
          const current = await auditLogRepository.findById(entry._id, {
            session,
          });
          if (
            !current ||
            current.status !== AuditLogStatus.Pending ||
            !current.undoDeadline ||
            current.undoDeadline.getTime() > now.getTime()
          ) {
            return;
          }

          const recipientProfileIds =
            await reservation.listAffectedRecipientProfileIds(
              current.targetId,
              { session },
            );
          const cancelledListing = await donation.finalizeCancellation(
            current.targetId,
            { session },
          );
          await reservation.cancelActiveReservationsByAdmin(current.targetId, {
            session,
          });
          createdNotifications =
            await notification.notifyListingCancelledByAdmin(
              {
                donationId: String(cancelledListing.id),
                recipientProfileIds,
              },
              { session },
            );
          updated = await auditLogRepository.updatePendingStatus(
            entry._id,
            AuditLogStatus.Finalized,
            {},
            { session },
          );
          if (!updated) {
            throw new ConflictError(
              `Audit log ${entry._id} was already finalized or undone`,
            );
          }
        });
        if (updated) {
          finalized.push(updated);
          notification.publishCreatedNotifications(createdNotifications);
        }
      } catch (error) {
        if (!(error instanceof ConflictError)) throw error;
      } finally {
        await session.endSession();
      }
    } else {
      const updated = await auditLogRepository.updatePendingStatus(
        entry._id,
        AuditLogStatus.Finalized,
      );
      if (updated) finalized.push(updated);
    }
  }

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
 *
 * The same box also has to match a literal Donor ID or Donation ID (SRS
 * 7.3.2), not just a name. Donor/Donation ids are opaque uuid strings, not
 * derivable from a name lookup, so the raw search term itself is passed
 * through as an extra Donor ID candidate (alongside the name-matched ids)
 * and as the Donation ID candidate -- an id that doesn't match anything
 * real just contributes no results, same as a name that doesn't match.
 */
export async function listAllFoodListings(filters = {}) {
  const { search, donorProfileId, donationId, page, limit } = filters;

  let searchDonorProfileIds;
  let searchDonationId;
  if (isNonEmptyString(search)) {
    const trimmedSearch = search.trim();
    searchDonorProfileIds = await identity.findDonorProfileIdsByName(search);
    searchDonorProfileIds.push(trimmedSearch);
    searchDonationId = trimmedSearch;
  }

  const {
    entries,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  } = await donation.listActiveListingsForAdmin({
    page,
    limit,
    donationId,
    donorProfileId,
    search,
    searchDonorProfileIds,
    searchDonationId,
  });

  const uniqueDonorProfileIds = [
    ...new Set(entries.map((entry) => entry.donorProfileId)),
  ];
  const donorProfiles = await identity.getDonorProfilesByIds(
    uniqueDonorProfileIds,
  );
  const donorNameById = new Map(
    donorProfiles.map((profile) => [profile._id, profile.companyName]),
  );

  return {
    listings: entries.map((entry) => ({
      ...entry,
      donorName: donorNameById.get(entry.donorProfileId) ?? null,
    })),
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  };
}

/**
 * Puts any Active food listing into cancellation limbo and logs it (SRS
 * 7.2.2). Same single-transaction shape as the two account actions above --
 * the transaction also covers adminCancelDonation's own status-flip write,
 * since it accepts and joins this same session instead of opening its own.
 *
 * Logged Pending with a live undoDeadline, same as DeactivateUser/
 * ReactivateUser: there's still no "un-cancel a listing" feature anywhere in
 * the UI, but the SRS's own Audit Log extra feature is the sanctioned way to
 * reverse this within the window. adminCancelDonation only flips the
 * listing to PendingCancellation -- the real cancellation (and its
 * reservation cascade) only happens in finalizeExpiredEntries if the window
 * passes without an undo.
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
      const before = await donation.readDonationById(donationId, {
        session,
      });
      after = await donation.adminCancelDonation(donationId, { session });

      await createAuditLog(
        {
          adminId,
          action: AdminActionType.CancelDonation,
          targetType: AuditTargetType.Donation,
          targetId: donationId,
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
