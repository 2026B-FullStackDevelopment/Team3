import { Wallet } from "../models/Wallet.js";

/**
 * Returns the user's wallet, creating it (balance 0) on first access. Upsert is
 * atomic, so concurrent first-touches can't create two wallets (userId unique).
 */
export async function getOrCreate(userId, session) {
  return Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    },
  );
}

/** Fetches the user's wallet, or null if none exists yet. */
export async function findByUserId(userId) {
  return Wallet.findOne({ userId });
}

/**
 * Atomically credits the wallet by amount, returning the updated document.
 * Upserts so a first-ever deposit also creates the wallet. Never a
 * read-modify-write (DATA_MODEL §2).
 */
export async function incrementBalance(userId, amount, session) {
  return Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    },
  );
}

/**
 * Atomically debits the wallet by amount ONLY if the balance is sufficient. The
 * `balance >= amount` guard in the filter makes the check-and-decrement a single
 * operation, so two concurrent debits can't overdraw. Returns the updated
 * document, or null when funds are insufficient (or no wallet exists).
 */
export async function decrementBalance(userId, amount, session) {
  return Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { returnDocument: "after", session },
  );
}
