import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export const NotificationType = {
  ListingMatched: "ListingMatched",
  ListingSoldOut: "ListingSoldOut",
  ListingCancelledByAdmin: "ListingCancelledByAdmin",
};

const NotificationSchema = {
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
    index: true,
    unique: true,
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
  },
  relatedDonationId: {
    type: String,
    default: () => uuidv4(),
    ref: "Donation",
  },
  isRead: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: null,
  },
};

export const Notification = mongoose.model("Notification", NotificationSchema);
