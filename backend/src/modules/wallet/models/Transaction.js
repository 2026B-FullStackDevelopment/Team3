import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";

export const TransactionType = {
  Deposit: "Deposit",
  SubscriptionPayment: "SubscriptionPayment",
  FoodPurchase: "FoodPurchase",
};

// Immutable ledger row written on every money movement. Keyed by userId to match
// Wallet. relatedReservationId is set only for a FoodPurchase (default null).
const TransactionSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    recipientProfileId: {
      type: String,
      required: true,
      index: true,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(TransactionType),
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    relatedReservationId: {
      type: String,
      ref: "Reservation",
      default: null,
    },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model("Transaction", TransactionSchema);
