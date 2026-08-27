import { ValidationError } from "../../../shared/errors/errors.js";

// Amounts are VND. Deposit must be a positive integer of at least 1000 (mirrors
// the listing price rule) and no more than the cap (rejects absurd values).
const MIN_DEPOSIT = 1000;
const MAX_DEPOSIT = 100_000_000;

/** Validates a deposit body { amount }. Returns { amount }. */
export function validateDeposit(body = {}) {
  const { amount } = body;

  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    throw new ValidationError("amount must be an integer");
  }
  if (amount < MIN_DEPOSIT) {
    throw new ValidationError(`amount must be at least ${MIN_DEPOSIT} VND`);
  }
  if (amount > MAX_DEPOSIT) {
    throw new ValidationError(`amount must not exceed ${MAX_DEPOSIT} VND`);
  }

  return { amount };
}
