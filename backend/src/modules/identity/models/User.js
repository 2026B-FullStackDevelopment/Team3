import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export const userRole = {
  Recipient: "Recipient",
  Donor: "Donor",
  Admin: "Admin",
};
export const AccountStatus = {
  Active: "Active",
  Deactivated: "Deactivated",
};

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(userRole),
    },
    accountStatus: {
      type: String,
      required: true,
      enum: Object.values(AccountStatus),
      default: AccountStatus.Active,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastFailedLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
export const User = mongoose.model("User", UserSchema);
