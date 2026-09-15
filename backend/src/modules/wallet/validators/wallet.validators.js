import { ValidationError } from "../../../shared/errors/errors.js";

// Amounts are VND. Deposit must be a positive integer of at least 1000 (mirrors
// the listing price rule) and no more than the cap (rejects absurd values).
const MIN_DEPOSIT = 1000;
const MAX_DEPOSIT = 1_000_000;

/**
 * Shared amount checks: integer, and within [min, MAX_DEPOSIT]. Returns
 * { amount }.
 */
function validateAmount(body, min) {
  const { amount } = body;

  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    throw new ValidationError("Amount must be an integer");
  }
  if (amount < min) {
    throw new ValidationError(
      `Amount must be at least ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(min)} VND`,
    );
  }
  if (amount > MAX_DEPOSIT) {
    throw new ValidationError(
      `Amount must not exceed ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(MAX_DEPOSIT)} VND`,
    );
  }

  return { amount };
}

/** Validates a simulated-deposit body { amount }. Returns { amount }. */
export function validateDeposit(body = {}) {
  return validateAmount(body, MIN_DEPOSIT);
}
