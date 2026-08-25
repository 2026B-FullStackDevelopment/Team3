import { PaymentMethod } from "../../reservation/models/Reservation.js";
import { ValidationError } from "../../../shared/errors/errors.js";

const MANUAL_PAYMENT_METHODS = [PaymentMethod.Cash, PaymentMethod.Wallet];

export function validateManualDonationInput(input = {}) {
  const recipientName = String(input.recipientName ?? "").trim();
  const quantity = Number(input.quantity);

  if (!recipientName) {
    throw new ValidationError("recipientName is required");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ValidationError("quantity must be a positive number");
  }

  const paymentMethod = input.paymentMethod;
  if (
    paymentMethod !== undefined &&
    !MANUAL_PAYMENT_METHODS.includes(paymentMethod)
  ) {
    throw new ValidationError("paymentMethod must be Cash or Wallet");
  }

  let amountReceived;
  if (input.amountReceived !== undefined) {
    amountReceived = Number(input.amountReceived);
    if (!Number.isFinite(amountReceived) || amountReceived < 0) {
      throw new ValidationError("amountReceived must be a non-negative number");
    }
  }

  return {
    recipientName,
    quantity,
    paymentMethod,
    amountReceived,
    recipientProfileId: input.recipientProfileId
      ? String(input.recipientProfileId)
      : undefined,
  };
}
