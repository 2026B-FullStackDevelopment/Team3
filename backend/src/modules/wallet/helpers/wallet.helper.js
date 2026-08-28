import mongoose from "mongoose";
import { ValidationError } from "../../../shared/errors/errors.js";

export function assertPositive(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("amount must be a positive number");
  }
}

/**
 * Runs `work` inside a single MongoDB transaction, passing it the session to
 * thread through every write. All writes commit together or roll back together,
 * so a wallet balance change and its ledger row can never be persisted apart. A
 * thrown error (e.g. insufficient funds) aborts the transaction — nothing is
 * written. Requires a replica set / Atlas (this deployment uses Atlas).
 */
export async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
