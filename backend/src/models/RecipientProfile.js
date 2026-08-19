import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const RecipientProfileSchema = {
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
    unique: true,
    index: true,
    required: true,
  },
  city: {
    type: String,
  },
  avatarUrl: {
    type: String,
  },
  isPremium: {
    type: Boolean,
    default: null,
  },
  premiumExpiryDate: {
    type: Date,
    default: null,
  },
};

export const RecipientProfile = mongoose.model(
  "RecipientProfile",
  RecipientProfileSchema,
);
