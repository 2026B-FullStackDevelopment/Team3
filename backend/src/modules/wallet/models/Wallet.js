import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const WalletSchema = {
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
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
};
export const Wallet = mongoose.model("Wallet", WalletSchema);
