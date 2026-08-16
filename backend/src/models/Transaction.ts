import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { PaymentMethod } from "./Reservation.js";
import { kStringMaxLength } from "node:buffer";
export enum TransactionType {
  Deposit = "Deposit",
  SubcriptionPayment = "SubscriptionPayment",
  FoodPurchase = "FoodPurchase",
}
export interface ITransaction {
  _id: string;
  recipientProfileId: string;
  type: string;
  amount: Number;
  method: string;
  relatedReservationId: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  recipientProfileId: {
    type: String,
    required: true,
    ref: "RecipientProfile",
  },
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
  },
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
  },
  relatedReservationId: {
    type: String,
    ref: "Reservation",
    default: () => uuidv4(),
  },
  createdAt: {
    type: Date,
  },
});
export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema,
);
