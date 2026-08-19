import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const RevokedTokenSchema = {
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
};
export const RevokedToken = mongoose.model("RevokedToken", RevokedTokenSchema);
