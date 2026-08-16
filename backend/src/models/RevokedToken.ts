import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IRevokedToken {
  _id: string;
  jti: string;
  userId?: string;
  expiresAt?: Date;
}

const RevokedTokenSchema = new Schema<IRevokedToken>({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  jti: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    ref: "User",
    default: () => uuidv4(),
  },
  expiresAt: {
    type: Date,
  },
});
export const RevokedToken = mongoose.model<IRevokedToken>(
  "RevokedToken",
  RevokedTokenSchema,
);
