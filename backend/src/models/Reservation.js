import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export const PaymentMethod = {
  Cash: "Cash",
  Wallet: "Wallet",
  Card: "Card",
};
export const ReservationStatus = {
  Reserved: "Reserved",
  CollectedByRecipient: "CollectedByRecipient",
  Collected: "Collected",
  CancelledByDonor: "CancelledByDonor",
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
    unique: true,
  },
  recipientProfileId: {
    type: String,
    ref: "RecipientProfile",
    required: true,
    index: true,
    unique: true,
  },
  manualRecipientName: {
    type: String,
    unique: true,
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
