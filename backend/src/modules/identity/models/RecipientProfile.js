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
    unique: true,
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
});

export const RecipientProfile = mongoose.model(
  "RecipientProfile",
  RecipientProfileSchema,
);
