import { ValidationError } from "../../../shared/errors/errors.js";

export function assertPositive(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("amount must be a positive number");
  }
}
