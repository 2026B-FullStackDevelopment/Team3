import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// One wallet per user (recipients only). Keyed by userId so the WalletFacade
// can move money by userId without reaching into Identity for a profile id.
const WalletSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "User",
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export const Wallet = mongoose.model("Wallet", WalletSchema);
