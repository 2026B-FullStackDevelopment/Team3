
import {
  AuditLog,
  AuditLogStatus,
  type AuditTargetType,
  type IAuditLog,
} from "../models/AuditLog.js";

type CreateAuditLogInput = Pick<
  IAuditLog,
  "action" | "adminId" | "targetId" | "targetType" | "previousState"
> &
  Partial<Pick<IAuditLog, "status" | "undoDeadline" | "createdAt">>;

/**
 * Inserts a new audit log entry when an admin takes an action.
 * Straight passthrough to AuditLog.create — the schema already owns
 * defaults (status: Pending, createdAt: now), so we don't restate them
 * here; callers only pass fields that vary per action.
 */
export async function create(entryData: CreateAuditLogInput): Promise<IAuditLog> {
  return AuditLog.create(entryData);
}

/**
 * Fetches a single audit log entry by its _id.
 * Just findById — no populate/projection, since the AdminService decides
 * what shape it needs, not this layer.
 */
export async function findById(id: string): Promise<IAuditLog | null> {
  return AuditLog.findById(id);
}

/**
 * Finds Pending entries whose undo window has expired (undoDeadline <= now).
 * Feeds the cron sweep that finalizes expired undo windows. We explicitly
 * exclude null undoDeadline (`$ne: null`) so entries with no undo window
 * (e.g. actions that never allowed undo) can never match — Mongo would
 * otherwise treat a missing/null date as satisfying `$lte`.
 */
export async function findExpiredPending(): Promise<IAuditLog[]> {
  return AuditLog.find({
    status: AuditLogStatus.Pending,
    undoDeadline: { $ne: null, $lte: new Date() },
  });
}

/**
 * Transitions an entry's status (e.g. Pending -> Finalized on sweep,
 * Pending -> Undone on manual undo), stamping undoneAt/undoneBy when given.
 */
export async function updateStatus(
  id: string,
  newStatus: AuditLogStatus,
  undoneAt?: Date,
  undoneBy?: string,
): Promise<IAuditLog | null> {
  const update: Partial<Pick<IAuditLog, "status" | "undoneAt" | "undoneBy">> = {
    status: newStatus,
  };
  if (undoneAt !== undefined) update.undoneAt = undoneAt;
  if (undoneBy !== undefined) update.undoneBy = undoneBy;

  return AuditLog.findByIdAndUpdate(id, { $set: update }, { new: true });
}

type AuditLogFilters = {
  targetType?: AuditTargetType;
  status?: AuditLogStatus;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
};

/**
 * Paginated/filtered list for the admin Audit Log page. Runs find() and
 * countDocuments() in parallel (Promise.all) since neither depends on the
 * other's result — the count is needed for the UI's page numbers, so we
 * can't avoid the second query, only avoid running it sequentially.
 */
export async function findAll(
  filters: AuditLogFilters = {},
): Promise<{ entries: IAuditLog[]; total: number }> {
  const { targetType, status, adminId, startDate, endDate, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};
  if (targetType !== undefined) query.targetType = targetType;
  if (status !== undefined) query.status = status;
  if (adminId !== undefined) query.adminId = adminId;
  if (startDate !== undefined || endDate !== undefined) {
    const createdAt: Record<string, Date> = {};
    if (startDate !== undefined) createdAt.$gte = startDate;
    if (endDate !== undefined) createdAt.$lte = endDate;
    query.createdAt = createdAt;
  }

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return { entries, total };
}
