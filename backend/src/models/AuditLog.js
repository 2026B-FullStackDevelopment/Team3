import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const AuditTargetType = {
  User: "User",
  Donation: "Donation",
};

export const AdminActionType = {
  DeactivateUser: "DeactivateUser",
  ReactivateUser: "ReactivateUser",
  CancelDonation: "CancelDonation",
};

export const AuditLogStatus = {
  Pending: "Pending",
  Finalized: "Finalized",
  Undone: "Undone",
};

const auditLogSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },

  adminId: {
    type: String,
    ref: "User",
    required: true,
    index: true,
  },

  action: {
    type: String,
    enum: Object.values(AdminActionType),
    required: true,
  },

  targetType: {
    type: String,
    enum: Object.values(AuditTargetType),
    required: true,
  },

  targetId: {
    type: String,
    required: true,
    index: true,
  },

  previousState: {
    type: Schema.Types.Mixed,
    required: true,
  },

  status: {
    type: String,
    enum: Object.values(AuditLogStatus),
    required: true,
    default: AuditLogStatus.Pending,
    index: true,
  },

  undoDeadline: {
    type: Date,
    default: null,
  },

  undoneBy: {
    type: String,
    ref: "User",
    default: null,
  },

  undoneAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
