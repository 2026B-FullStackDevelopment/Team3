import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { PaymentMethod } from "../../donations/models/Reservation.js";
export const TransactionType = {
  Deposit: "Deposit",
  SubcriptionPayment: "SubscriptionPayment",
  FoodPurchase: "FoodPurchase",
};

const TransactionSchema = {
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
};
export const Transaction = mongoose.model("Transaction", TransactionSchema);
