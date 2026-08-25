import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const RevokedTokenSchema = new Schema({
  _id: {
    type: String,
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
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index: Mongo auto-purges a revocation once the underlying token has expired.
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = mongoose.model("RevokedToken", RevokedTokenSchema);
