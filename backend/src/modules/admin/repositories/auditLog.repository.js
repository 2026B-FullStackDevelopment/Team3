import { AuditLog, AuditLogStatus } from "../models/AuditLog.js";

/**
 * Inserts a new audit log entry when an admin takes an action.
 * Uses the array form of AuditLog.create so an optional session can be
 * attached (Mongoose requires the array form for that) -- the schema still
 * owns defaults (status: Pending, createdAt: now) for anything the caller
 * doesn't pass.
 */
export async function create(entryData, options = {}) {
  const [created] = await AuditLog.create([entryData], {
    session: options.session,
  });
  return created;
}

/**
 * Fetches a single audit log entry by its _id.
 * Just findById — no populate/projection, since the AdminService decides
 * what shape it needs, not this layer.
 */
export async function findById(id, options = {}) {
  const query = AuditLog.findById(id);
  if (options.session) query.session(options.session);
  return query;
}

/**
 * Finds Pending entries whose undo window has expired (undoDeadline <= now).
 * Feeds the cron sweep that finalizes expired undo windows. We explicitly
 * exclude null undoDeadline (`$ne: null`) so entries with no undo window
 * (e.g. actions that never allowed undo) can never match — Mongo would
 * otherwise treat a missing/null date as satisfying `$lte`.
 */
export async function findExpiredPending(options = {}) {
  const query = AuditLog.find({
    status: AuditLogStatus.Pending,
    undoDeadline: { $ne: null, $lte: new Date() },
  });
  if (options.limit !== undefined) query.limit(options.limit);
  if (options.session) query.session(options.session);
  return query;
}

/**
 * Atomically transitions an entry only while it is still Pending. The status
 * predicate is the concurrency guard shared by manual undo and the expiry
 * sweep: once either path wins, the other receives null and must not apply a
 * second transition.
 */
export async function updatePendingStatus(
  id,
  newStatus,
  fields = {},
  options = {},
) {
  return AuditLog.findOneAndUpdate(
    { _id: id, status: AuditLogStatus.Pending },
    { $set: { ...fields, status: newStatus } },
    { new: true, session: options.session },
  );
}

/**
 * Transitions an entry's status (e.g. Pending -> Finalized on sweep,
 * Pending -> Undone on manual undo), stamping undoneAt/undoneBy when given.
 */
export async function updateStatus(
  id,
  newStatus,
  undoneAt,
  undoneBy,
  options = {},
) {
  const update = { status: newStatus };
  if (undoneAt !== undefined) update.undoneAt = undoneAt;
  if (undoneBy !== undefined) update.undoneBy = undoneBy;

  return AuditLog.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, session: options.session },
  );
}

/**
 * Paginated/filtered list for the admin Audit Log page. Runs find() and
 * countDocuments() in parallel (Promise.all) since neither depends on the
 * other's result — the count is needed for the UI's page numbers, so we
 * can't avoid the second query, only avoid running it sequentially.
 */
export async function findAll(filters = {}) {
  const {
    targetType,
    status,
    adminId,
    adminIds,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const query = {};
  if (targetType !== undefined) query.targetType = targetType;
  if (status !== undefined) query.status = status;
  if (Array.isArray(adminIds)) {
    // adminIds (plural) comes from an Admin-email search resolved in the
    // identity module (SRS §8's Audit Log search). If an explicit adminId is
    // ALSO given, intersect them instead of letting either one silently
    // override the other -- same fix as the donorProfileId/donorProfileIds
    // bug in donorListing.repository.js's buildDonationQuery (2026-09-07).
    const resolvedIds =
      adminId !== undefined
        ? adminIds.filter((id) => id === adminId)
        : adminIds;
    query.adminId = { $in: resolvedIds };
  } else if (adminId !== undefined) {
    query.adminId = adminId;
  }
  if (startDate !== undefined || endDate !== undefined) {
    const createdAt = {};
    if (startDate !== undefined) createdAt.$gte = startDate;
    if (endDate !== undefined) createdAt.$lte = endDate;
    query.createdAt = createdAt;
  }

  const skip = (page - 1) * limit; // for the skip button

  const [entries, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return { entries, total };
}
