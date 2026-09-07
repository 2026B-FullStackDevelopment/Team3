import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, test } from "node:test";

import mongoose from "mongoose";

import { connectDatabase } from "../../../../config/database.js";
import { RecipientProfile } from "../../../identity/models/RecipientProfile.js";
import { Reservation } from "../../../reservation/models/Reservation.js";
import {
  Transaction,
  TransactionType,
} from "../../../wallet/models/Transaction.js";
import { Wallet } from "../../../wallet/models/Wallet.js";
import { PaymentMethod } from "../../../../shared/constants/paymentMethod.js";
import { foodCategory } from "../../../notification/models/NotificationPreference.js";
import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../../models/donation.model.js";
import { createManualDonation } from "../manualDonation.service.js";

const created = {
  donationIds: [],
  recipientProfileIds: [],
  userIds: [],
};

before(async () => {
  await connectDatabase();
});

afterEach(async () => {
  await Transaction.deleteMany({ userId: { $in: created.userIds } });
  await Reservation.deleteMany({ donationId: { $in: created.donationIds } });
  await Wallet.deleteMany({ userId: { $in: created.userIds } });
  await Donation.deleteMany({ _id: { $in: created.donationIds } });
  await RecipientProfile.deleteMany({
    _id: { $in: created.recipientProfileIds },
  });

  created.donationIds.length = 0;
  created.recipientProfileIds.length = 0;
  created.userIds.length = 0;
});

after(async () => {
  await mongoose.connection.close();
});

async function createWalletPaymentFixtures(balance) {
  const suffix = randomUUID();
  const donorProfileId = randomUUID();
  const recipientUserId = randomUUID();
  const recipientProfileId = randomUUID();
  const donationId = randomUUID();

  created.userIds.push(recipientUserId);
  created.recipientProfileIds.push(recipientProfileId);
  created.donationIds.push(donationId);

  await RecipientProfile.create({
    _id: recipientProfileId,
    userId: recipientUserId,
    userName: `wallet-recipient-${suffix}`,
  });
  await Wallet.create({ userId: recipientUserId, balance });
  await Donation.create({
    _id: donationId,
    donorProfileId,
    name: `Wallet payment listing ${suffix}`,
    description: "Isolated manual-donation wallet test",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: foodCategory.BakedGoods,
    isVegetarian: true,
    donationLimit: 0,
    ration: 0,
    price: 10_000,
    remainingQuantity: 10,
    status: DonationStatus.Active,
    revenue: 0,
    createdAt: new Date(),
  });

  return {
    donorProfileId,
    recipientUserId,
    recipientProfileId,
    donationId,
  };
}

test("wallet payment debits by recipient userId and records the purchase", async () => {
  const fixture = await createWalletPaymentFixtures(50_000);

  const result = await createManualDonation(
    fixture.donorProfileId,
    fixture.donationId,
    {
      recipientName: "Wallet Recipient",
      recipientProfileId: fixture.recipientProfileId,
      quantity: 2,
      paymentMethod: PaymentMethod.Wallet,
    },
  );

  assert.equal(result.payment.method, PaymentMethod.Wallet);
  assert.equal(result.payment.totalPrice, 20_000);
  assert.equal(result.payment.amountReceived, 20_000);
  assert.equal(result.payment.change, 0);

  const wallet = await Wallet.findOne({ userId: fixture.recipientUserId });
  assert.equal(wallet.balance, 30_000);

  const transaction = await Transaction.findOne({
    userId: fixture.recipientUserId,
    relatedReservationId: result.donation._id,
  });
  assert.equal(transaction.type, TransactionType.FoodPurchase);
  assert.equal(transaction.method, PaymentMethod.Wallet);
  assert.equal(transaction.amount, 20_000);

  const donation = await Donation.findById(fixture.donationId);
  assert.equal(donation.remainingQuantity, 8);
  assert.equal(donation.revenue, 20_000);
});

test("insufficient wallet funds roll back the manual donation", async () => {
  const fixture = await createWalletPaymentFixtures(5_000);

  await assert.rejects(
    createManualDonation(fixture.donorProfileId, fixture.donationId, {
      recipientName: "Wallet Recipient",
      recipientProfileId: fixture.recipientProfileId,
      quantity: 1,
      paymentMethod: PaymentMethod.Wallet,
    }),
    /Insufficient wallet balance/,
  );

  const wallet = await Wallet.findOne({ userId: fixture.recipientUserId });
  const donation = await Donation.findById(fixture.donationId);
  const reservations = await Reservation.countDocuments({
    donationId: fixture.donationId,
  });
  const transactions = await Transaction.countDocuments({
    userId: fixture.recipientUserId,
  });

  assert.equal(wallet.balance, 5_000);
  assert.equal(donation.remainingQuantity, 10);
  assert.equal(donation.revenue, 0);
  assert.equal(reservations, 0);
  assert.equal(transactions, 0);
});
