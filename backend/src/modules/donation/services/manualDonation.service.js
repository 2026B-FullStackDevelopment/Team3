import mongoose from "mongoose";

import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
import {
  Reservation,
  ReservationStatus,
} from "../../reservation/models/Reservation.js";
import {
  Transaction,
  TransactionType,
} from "../../wallet/models/Transaction.js";
import { Wallet } from "../../wallet/models/Wallet.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import { buildSoldOutAlert } from "./soldOutAlert.service.js";
import { Donation, DonationStatus } from "../models/donation.model.js";
import { validateManualDonationInput } from "../validators/manualDonation.js";

export async function createManualDonation(
  donorProfileId,
  donationId,
  input,
  options = {},
) {
  if (!donorProfileId) throw new ValidationError("donorProfileId is required");
  if (!donationId) throw new ValidationError("donationId is required");

  const data = validateManualDonationInput(input);
  const session = options.session ?? (await mongoose.startSession());
  const ownsSession = !options.session;

  const execute = async () => {
    const listing = await Donation.findById(donationId).session(session);
    if (!listing) throw new NotFoundError("Food listing not found");
    if (String(listing.donorProfileId) !== String(donorProfileId)) {
      throw new ForbiddenError("The food listing belongs to another donor");
    }
    if (listing.status !== DonationStatus.Active) {
      throw new ConflictError(
        "Only active food listings accept manual donations",
      );
    }
    if (data.quantity > listing.remainingQuantity) {
      throw new ConflictError(
        "Donation quantity exceeds the remaining quantity",
      );
    }

    const totalPrice = data.quantity * listing.price;
    let paymentMethod = data.paymentMethod;
    let amountReceived = data.amountReceived;
    let change = 0;

    if (totalPrice === 0) {
      paymentMethod = undefined;
      amountReceived = 0;
    } else if (!paymentMethod) {
      throw new ValidationError("paymentMethod is required for a paid listing");
    } else if (paymentMethod === PaymentMethod.Cash) {
      if (amountReceived === undefined) {
        throw new ValidationError(
          "amountReceived is required for cash payment",
        );
      }
      if (amountReceived < totalPrice) {
        throw new ConflictError(
          "The received amount is less than the total price",
        );
      }
      change = amountReceived - totalPrice;
    } else {
      if (!data.recipientProfileId) {
        throw new ValidationError(
          "recipientProfileId is required for wallet payment",
        );
      }
      amountReceived = totalPrice;
    }

    const remainingQuantity = listing.remainingQuantity - data.quantity;
    const soldOut = remainingQuantity < 1;
    const updatedListing = await Donation.findOneAndUpdate(
      {
        _id: donationId,
        donorProfileId: String(donorProfileId),
        status: DonationStatus.Active,
        remainingQuantity: { $gte: data.quantity },
      },
      {
        $inc: { remainingQuantity: -data.quantity, revenue: totalPrice },
        ...(soldOut
          ? { $set: { status: DonationStatus.SoldOut, closedAt: new Date() } }
          : {}),
      },
      { new: true, session },
    );
    if (!updatedListing) {
      throw new ConflictError("The listing changed; retry the manual donation");
    }

    const [reservation] = await Reservation.create(
      [
        {
          donationId,
          recipientProfileId: data.recipientProfileId,
          manualRecipientName: data.recipientName,
          quantity: data.quantity,
          status: ReservationStatus.Collected,
          totalPaid: totalPrice,
          paymentMethod,
          collectedAt: new Date(),
        },
      ],
      { session },
    );

    if (paymentMethod === PaymentMethod.Wallet) {
      const wallet = await Wallet.findOneAndUpdate(
        {
          recipientProfileId: data.recipientProfileId,
          balance: { $gte: totalPrice },
        },
        { $inc: { balance: -totalPrice } },
        { new: true, session },
      );
      if (!wallet)
        throw new ConflictError("Recipient wallet has insufficient funds");

      await Transaction.create(
        [
          {
            recipientProfileId: data.recipientProfileId,
            amount: totalPrice,
            type: TransactionType.FoodPurchase,
            method: PaymentMethod.Wallet,
            relatedReservationId: reservation._id,
            createdAt: new Date(),
          },
        ],
        { session },
      );
    }

    const soldOutAlert = soldOut ? buildSoldOutAlert(updatedListing) : null;

    return {
      donation: reservation,
      payment: {
        method: paymentMethod ?? null,
        totalPrice,
        amountReceived,
        change,
      },
      listing: updatedListing,
      soldOutAlert,
    };
  };

  try {
    if (!ownsSession) return await execute();
    let result;
    await session.withTransaction(async () => {
      result = await execute();
    });
    return result;
  } finally {
    if (ownsSession) await session.endSession();
  }
}
