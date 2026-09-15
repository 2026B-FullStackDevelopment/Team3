import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const RecipientProfileSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
    index: true,
    unique: true,
  },
  userName: {
    type: String,
    index: true,
  },
  city: {
    type: String,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiryDate: {
    type: Date,
    default: null,
  },
  // Stripe Checkout Session id of the last card premium payment applied. Used to
  // make the payment webhook idempotent (a re-delivered event for the same
  // session is a no-op). Null/undefined for wallet-path or never-card users.
  lastPremiumSessionId: {
    type: String,
    default: undefined,
  },
});

export const RecipientProfile = mongoose.model(
  "RecipientProfile",
  RecipientProfileSchema,
);
