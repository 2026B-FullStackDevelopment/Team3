import * as auditLogRepository from "../repositories/auditLog.repository.js";
import { AdminActionType, AuditTargetType, AuditLogStatus } from "../models/AuditLog.js";
import { NotFoundError, ValidationError, ConflictError, NotImplementedError } from "../../../shared/errors/errors.js";

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
 */
export async function createAuditLog(input) {
  const { adminId, action, targetType, targetId, previousState, undoDeadline } = input;

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

  const created = await auditLogRepository.create({
    adminId,
    action,
    targetType,
    targetId,
    previousState,
    ...(normalizedUndoDeadline !== undefined && { undoDeadline: normalizedUndoDeadline }),
  });

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
 */
export async function listAuditLogs(filters = {}) {
  const { targetType, status, adminId, startDate, endDate, page, limit } = filters;

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

  const { entries, total } = await auditLogRepository.findAll({
    targetType,
    status,
    adminId,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    page: normalizedPage,
    limit: normalizedLimit,
  });

  return {
    entries: entries.map(toAuditLogDTO),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

/**
 * Attempts to undo a Pending admin action within its undo window.
 * Validates the entry is actually undoable (still Pending, deadline not
 * passed) before anything else, since that check is real regardless of
 * what undo eventually does. It stops short of reverting the target
 * User/Donation record: per A.3.1, that has to go through that module's own
 * service interface, and User/Donation don't expose one yet. Throwing here
 * instead of flipping the entry to Undone avoids reporting a successful
 * undo that didn't actually undo anything.
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

  throw new NotImplementedError(
    "Undo is not available yet: reverting the target record requires the User/Donation module service interfaces, which are not implemented."
  );
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
