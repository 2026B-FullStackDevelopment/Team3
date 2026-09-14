import mongoose from "mongoose";

import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
import * as reservation from "../../reservation/interfaces/reservation.interface.js";
import * as identity from "../../identity/index.js";
import * as wallet from "../../wallet/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import { buildSoldOutAlert } from "./soldOutAlert.service.js";
import { DonationStatus } from "../models/donation.model.js";
import * as donationRepository from "../repositories/donation.repo.js";
import { validateManualDonationInput } from "../validators/manualDonation.js";
import * as notification from "../../notification/interfaces/notification.interface.js";

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
  let createdNotifications = [];

  const execute = async () => {
    const listing = await donationRepository.findById(donationId, { session });
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
    let recipientUserId;

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
      const recipientProfile = await identity.loadRecipientProfileById(
        data.recipientProfileId,
        { session },
      );
      if (!recipientProfile) {
        throw new NotFoundError("Recipient profile not found");
      }
      recipientUserId = String(recipientProfile.userId);
      amountReceived = totalPrice;
    }

    const updatedListing = await donationRepository.applyManualDonation(
      donationId,
      donorProfileId,
      data.quantity,
      totalPrice,
      { session },
    );
    if (!updatedListing) {
      throw new ConflictError("The listing changed; retry the manual donation");
    }
    const soldOut = updatedListing.status === DonationStatus.SoldOut;

    const reservationResult = await reservation.recordManualCollection(
      {
        donationId,
        recipientProfileId: data.recipientProfileId,
        manualRecipientName: data.recipientName,
        quantity: data.quantity,
        totalPaid: totalPrice,
        paymentMethod,
      },
      { session },
    );

    if (paymentMethod === PaymentMethod.Wallet) {
      await wallet.debit(
        recipientUserId,
        totalPrice,
        {
          type: wallet.TransactionType.FoodPurchase,
          method: PaymentMethod.Wallet,
          relatedReservationId: reservationResult._id,
        },
        { session },
      );
    }

    const soldOutAlert = soldOut ? buildSoldOutAlert(updatedListing) : null;

    if (soldOutAlert) {
      createdNotifications = [
        await notification.notifyListingSoldOut(soldOutAlert, { session }),
      ];
    }

    return {
      donation: reservationResult,
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
    notification.publishCreatedNotifications(createdNotifications);
    return result;
  } finally {
    if (ownsSession) await session.endSession();
  }
}
