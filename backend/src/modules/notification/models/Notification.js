import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const NotificationType = {
  ListingMatched: "ListingMatched",
  ListingSoldOut: "ListingSoldOut",
  ListingCancelledByAdmin: "ListingCancelledByAdmin",
};

const NotificationSchema = new Schema({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  },
  relatedDonationId: {
    type: String,
    ref: "Donation",
    required: true,
    index: true,
  },
  dedupeKey: {
    type: String,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export const Notification = mongoose.model("Notification", NotificationSchema);
