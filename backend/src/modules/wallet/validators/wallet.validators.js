import { ValidationError } from "../../../shared/errors/errors.js";

// Amounts are VND. Deposit must be a positive integer of at least 1000 (mirrors
// the listing price rule) and no more than the cap (rejects absurd values).
const MIN_DEPOSIT = 1000;
const MAX_DEPOSIT = 1_000_000;

// Stripe rejects charges below roughly $0.50 USD (~13,000 VND). Card top-ups
// use a comfortable floor above that so a session can never fail Stripe's
// minimum-charge check. The simulated /deposit keeps the lower MIN_DEPOSIT.
const MIN_TOPUP = 20_000;

/**
 * Shared amount checks: integer, and within [min, MAX_DEPOSIT]. Returns
 * { amount }.
 */
function validateAmount(body, min) {
  const { amount } = body;

  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    throw new ValidationError("amount must be an integer");
  }
  if (amount < min) {
    throw new ValidationError(`amount must be at least ${min} VND`);
  }
  if (amount > MAX_DEPOSIT) {
    throw new ValidationError(`amount must not exceed ${MAX_DEPOSIT} VND`);
  }

  return { amount };
}

/** Validates a simulated-deposit body { amount }. Returns { amount }. */
export function validateDeposit(body = {}) {
  return validateAmount(body, MIN_DEPOSIT);
}

/**
 * Validates a Stripe card top-up body { amount }. Same rules as a deposit but
 * with a higher floor to clear Stripe's minimum charge. Returns { amount }.
 */
export function validateTopUp(body = {}) {
  return validateAmount(body, MIN_TOPUP);
}
