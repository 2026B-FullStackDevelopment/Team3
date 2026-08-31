import { Transaction } from "../models/Transaction.js";

/**
 * Inserts a transaction ledger row within the given session (so it commits with
 * the balance change as one atomic unit). `Model.create` needs the array form
 * when passed options; we return the single created doc.
 */
export async function create(data, session) {
  const [transaction] = await Transaction.create([data], { session });
  return transaction;
}

/** Lists a user's transactions, newest first. */
export async function listByUserId(userId) {
  return Transaction.find({ userId }).sort({ createdAt: -1 });
}
