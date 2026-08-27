import { Transaction } from "../models/Transaction.js";

/** Inserts a transaction ledger row. Caller supplies an already-shaped object. */
export async function create(data) {
  return Transaction.create(data);
}

/** Lists a user's transactions, newest first. */
export async function IlistByUserId(userId) {
  return Transaction.find({ userId }).sort({ createdAt: -1 });
}
