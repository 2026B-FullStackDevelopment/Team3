import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export enum PaymentMethod {
  Cash = "Cash",
  Wallet = "Wallet",
  Card = "Card",
}
export enum ReservationStatus {
  Reserved = "Reserved",
  CollectedByRecipient = "CollectedByRecipient",
  Collected = "Collected",
  CancelledByDonor = "CancelledByDonor",
}

export interface IReservation {
  _id: string;
  donationId: string;
  recipientProfileId: string;
  manualRecipientName: string;
  quantity: number;
  status?: ReservationStatus;
  totalPaid: number;
  paymentMethod?: PaymentMethod;
  feedback?: string | null;
  reservedAt?: Date | null;
  collectedAt?: Date | null;
}

const ReservationSchema = new Schema<IReservation>({
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
});

export const Reservation = mongoose.model<IReservation>(
  "Reservation",
  ReservationSchema,
);
