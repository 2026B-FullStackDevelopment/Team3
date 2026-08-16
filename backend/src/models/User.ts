import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export enum userRole {
  Recipient = "Recipient",
  Donor = "Donor",
  Admin = "Admin",
}
export enum AccountStatus {
  Active = "Active",
  Deactivated = "Deactivated",
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: userRole;
  accountStatus: AccountStatus;
  failedLoginAttemps: number;
  lockedUntil?: Date | null;
  lastFailedLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
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
    },
    failedLoginAttemps: {
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
export const User = mongoose.model<IUser>("User", userSchema);
