
import { AuditLog, AuditLogStatus } from "../models/AuditLog.js";

/**
 * Inserts a new audit log entry when an admin takes an action.
 * Straight passthrough to AuditLog.create — the schema already owns
 * defaults (status: Pending, createdAt: now), so we don't restate them
 * here; callers only pass fields that vary per action.
 */
export async function create(entryData) {
  return AuditLog.create(entryData);
}

/**
 * Fetches a single audit log entry by its _id.
 * Just findById — no populate/projection, since the AdminService decides
 * what shape it needs, not this layer.
 */
export async function findById(id) {
  return AuditLog.findById(id);
}

/**
 * Finds Pending entries whose undo window has expired (undoDeadline <= now).
 * Feeds the cron sweep that finalizes expired undo windows. We explicitly
 * exclude null undoDeadline (`$ne: null`) so entries with no undo window
 * (e.g. actions that never allowed undo) can never match — Mongo would
 * otherwise treat a missing/null date as satisfying `$lte`.
 */
export async function findExpiredPending() {
  return AuditLog.find({
    status: AuditLogStatus.Pending,
    undoDeadline: { $ne: null, $lte: new Date() },
  });
}

/**
 * Transitions an entry's status (e.g. Pending -> Finalized on sweep,
 * Pending -> Undone on manual undo), stamping undoneAt/undoneBy when given.
 */
export async function updateStatus(id, newStatus, undoneAt, undoneBy) {
  const update = { status: newStatus };
  if (undoneAt !== undefined) update.undoneAt = undoneAt;
  if (undoneBy !== undefined) update.undoneBy = undoneBy;

  return AuditLog.findByIdAndUpdate(id, { $set: update }, { new: true });
}

/**
 * Paginated/filtered list for the admin Audit Log page. Runs find() and
 * countDocuments() in parallel (Promise.all) since neither depends on the
 * other's result — the count is needed for the UI's page numbers, so we
 * can't avoid the second query, only avoid running it sequentially.
 */
export async function findAll(filters = {}) {
  const { targetType, status, adminId, startDate, endDate, page = 1, limit = 20 } = filters;

  const query = {};
  if (targetType !== undefined) query.targetType = targetType;
  if (status !== undefined) query.status = status;
  if (adminId !== undefined) query.adminId = adminId;
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
