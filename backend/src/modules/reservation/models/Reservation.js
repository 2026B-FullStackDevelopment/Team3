import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// PaymentMethod now lives in shared/; re-exported here so existing consumers
// that import it from this model keep working.
import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
export const ReservationStatus = {
  Reserved: "Reserved",
  CollectedByRecipient: "CollectedByRecipient",
  Collected: "Collected",
  CancelledByDonor: "CancelledByDonor",
  CancelledByAdmin: "CancelledByAdmin",
};

export const ReservationSchema = {
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  donationId: {
    type: String,
    ref: "Donation",
    required: true,
    index: true,
  },
  recipientProfileId: {
    type: String,
    ref: "RecipientProfile",
    index: true,
    default: null,
  },
  manualRecipientName: {
    type: String,
    index: true,
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(ReservationStatus),
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
  },
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  feedback: {
    type: String,
    default: null,
  },
  reservedAt: {
    type: Date,
    default: null,
  },
  collectedAt: {
    type: Date,
    default: null,
  },
};

export const Reservation = mongoose.model("Reservation", ReservationSchema);
