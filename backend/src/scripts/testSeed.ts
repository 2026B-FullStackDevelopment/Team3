import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";

import { User, userRole, AccountStatus } from "../models/User.js";
import { RecipientProfile } from "../models/RecipientProfile.js";
import { DonorProfile } from "../models/DonorProfile.js";
import {
  NotificationPreference,
  foodCategory,
} from "../models/NotificationPreference.js";
import { Wallet } from "../models/Wallet.js";

import {
  Donation,
  MeasurementUnit,
  DonationStatus,
} from "../models/donation.js";

import {
  Reservation,
  ReservationStatus,
  PaymentMethod,
} from "../models/Reservation.js";

import { Transaction, TransactionType } from "../models/Transaction.js";

import { Notification, NotificationType } from "../models/Notification.js";

import { RevokedToken } from "../models/RevokedToken.js";

import {
  AuditLog,
  AuditTargetType,
  AdminActionType,
  AuditLogStatus,
} from "../models/AuditLog.js";

import { DonorReport, ReportType } from "../models/DonorReport.js";

import { DonorReportItem } from "../models/DonorReportItem.js";

type TestResult = {
  name: string;
  passed: boolean;
  details?: string;
};

const results: TestResult[] = [];

/**
 * IMPORTANT
 * ---------
 * This test writes temporary documents to the connected database.
 * Every inserted test document uses a unique timestamp-based suffix,
 * and cleanup runs in finally().
 *
 * It DOES NOT call deleteMany({}) on the whole database.
 */
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createdIds = {
  users: [] as string[],
  recipientProfiles: [] as string[],
  donorProfiles: [] as string[],
  notificationPreferences: [] as string[],
  wallets: [] as string[],
  donations: [] as string[],
  reservations: [] as string[],
  transactions: [] as string[],
  notifications: [] as string[],
  revokedTokens: [] as string[],
  auditLogs: [] as string[],
  donorReports: [] as string[],
  donorReportItems: [] as string[],
};

function pass(name: string, details?: string): void {
  results.push({ name, passed: true });
  console.log(`PASS  ${name}${details ? ` - ${details}` : ""}`);
}

function fail(name: string, error: unknown): void {
  const details = error instanceof Error ? error.message : String(error);

  results.push({
    name,
    passed: false,
    details,
  });

  console.error(`FAIL  ${name} - ${details}`);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function testDatabaseConnection(): Promise<void> {
  assert(
    mongoose.connection.readyState === 1,
    `Expected readyState 1, got ${mongoose.connection.readyState}`,
  );

  assert(mongoose.connection.db, "MongoDB database object is unavailable");

  await mongoose.connection.db.admin().ping();
}

async function testIndexes(): Promise<void> {
  const models = [
    User,
    RecipientProfile,
    DonorProfile,
    NotificationPreference,
    Wallet,
    Donation,
    Reservation,
    Transaction,
    Notification,
    RevokedToken,
    AuditLog,
    DonorReport,
    DonorReportItem,
  ];

  for (const model of models) {
    await model.init();
  }

  const donationIndexes = await Donation.collection.indexes();

  const donorProfileIndex = donationIndexes.find(
    (index) =>
      Object.keys(index.key).length === 1 && index.key.donorProfileId === 1,
  );

  if (donorProfileIndex?.unique) {
    throw new Error(
      "Donation.donorProfileId is still UNIQUE. " +
        "That prevents one donor from owning multiple donations.",
    );
  }
}

async function createUsers() {
  const admin = await User.create({
    username: `test-admin-${runId}`,
    email: `test-admin-${runId}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_HASH",
    role: userRole.Admin,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const donor = await User.create({
    username: `test-donor-${runId}`,
    email: `test-donor-${runId}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_HASH",
    role: userRole.Donor,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const recipient = await User.create({
    username: `test-recipient-${runId}`,
    email: `test-recipient-${runId}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_HASH",
    role: userRole.Recipient,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  createdIds.users.push(admin._id, donor._id, recipient._id);

  assert(typeof admin._id === "string", "User._id is not a UUID/string");

  assert(typeof donor._id === "string", "Donor User._id is not a UUID/string");

  assert(
    typeof recipient._id === "string",
    "Recipient User._id is not a UUID/string",
  );

  return {
    admin,
    donor,
    recipient,
  };
}

async function createProfiles(donorUserId: string, recipientUserId: string) {
  const recipientProfile = await RecipientProfile.create({
    userId: recipientUserId,
    userName: `profile-${runId}`,
    city: "Ho Chi Minh City",
    avatarUrl: "",
    isPremium: false,
    premiumExpiryDate: null,
  });

  createdIds.recipientProfiles.push(recipientProfile._id);

  const donorProfile = await DonorProfile.create({
    userId: donorUserId,
    companyName: `Test Company ${runId}`,
    taxCode: `TEST-${runId}`,
    city: "Ho Chi Minh City",
    avatarUrl: "",
    address: "Test address",
    location: {
      type: "Point",
      coordinates: [106.7009, 10.7769],
    },
  });

  createdIds.donorProfiles.push(donorProfile._id);

  assert(
    recipientProfile.userId === recipientUserId,
    "RecipientProfile.userId does not match User._id",
  );

  assert(
    donorProfile.userId === donorUserId,
    "DonorProfile.userId does not match User._id",
  );

  return {
    recipientProfile,
    donorProfile,
  };
}

async function createNotificationPreference(recipientProfileId: string) {
  const preference = await NotificationPreference.create({
    recipientProfileId,

    // Adjust these names if your model differs.
    foodCategory: [foodCategory.Fruit],
    isVegetarian: false,
    priceRangeMin: 0,
    priceRangeMax: 100000,
    city: "Ho Chi Minh City",
  });

  createdIds.notificationPreferences.push(preference._id);

  return preference;
}

async function createWallet(recipientProfileId: string) {
  const wallet = await Wallet.create({
    recipientProfileId,
    balance: 100000,
  });

  createdIds.wallets.push(wallet._id);

  return wallet;
}

async function createDonations(donorProfileId: string) {
  const donationA = await Donation.create({
    donorProfileId,
    name: `Test Bread ${runId}`,
    description: "Database entity test donation A",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: foodCategory.BakedGoods,
    isVegetarian: true,
    donationLimit: 5,
    price: 0,
    remainingQuantity: 10,
    status: DonationStatus.Active,
    closedAt: null,
  });

  createdIds.donations.push(donationA._id);

  /*
   * Creating TWO donations with the same donorProfileId deliberately
   * tests that donorProfileId is not accidentally unique.
   */
  const donationB = await Donation.create({
    donorProfileId,
    name: `Test Fruit ${runId}`,
    description: "Database entity test donation B",
    measurementUnit: MeasurementUnit.KG,
    foodCategory: foodCategory.Fruit,
    isVegetarian: true,
    donationLimit: 3,
    price: 0,
    remainingQuantity: 5,
    status: DonationStatus.Active,
    closedAt: null,
  });

  createdIds.donations.push(donationB._id);

  return {
    donationA,
    donationB,
  };
}

async function createReservation(
  donationId: string,
  recipientProfileId: string,
) {
  const reservation = await Reservation.create({
    donationId,
    recipientProfileId,
    manualRecipientName: "Test Recipient",
    quantity: 2,
    status: ReservationStatus.Reserved,
    totalPaid: 0,
    paymentMethod: PaymentMethod.Cash,
    feedback: null,
    reservedAt: new Date(),
    collectedAt: null,
  });

  createdIds.reservations.push(reservation._id);

  return reservation;
}

async function createTransaction(
  recipientProfileId: string,
  reservationId: string,
) {
  const transaction = await Transaction.create({
    recipientProfileId,
    type: TransactionType.FoodPurchase,
    amount: 0,
    method: PaymentMethod.Cash,
    relatedReservationId: reservationId,
    createdAt: new Date(),
  });

  createdIds.transactions.push(transaction._id);

  return transaction;
}

async function createNotification(userId: string, donationId: string) {
  const notification = await Notification.create({
    userId,
    type: NotificationType.ListingMatched,
    relatedDonationId: donationId,
    isRead: false,
    createdAt: new Date(),
  });

  createdIds.notifications.push(notification._id);

  return notification;
}

async function createRevokedToken(userId: string) {
  const token = await RevokedToken.create({
    jti: `test-token-${runId}`,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  createdIds.revokedTokens.push(token._id);

  return token;
}

async function createAuditLog(adminId: string, targetUserId: string) {
  const auditLog = await AuditLog.create({
    adminId,
    action: AdminActionType.DeactivateUser,
    targetType: AuditTargetType.User,
    targetId: targetUserId,
    previousState: {
      accountStatus: AccountStatus.Active,
    },
    status: AuditLogStatus.Pending,
    undoDeadline: new Date(Date.now() + 5 * 60 * 1000),
    undoneBy: null,
    undoneAt: null,
  });

  createdIds.auditLogs.push(auditLog._id);

  return auditLog;
}

async function createDonorReport(donorProfileId: string) {
  const report = await DonorReport.create({
    donorProfileId,
    reportType: ReportType.ByCategory,
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T23:59:59.999Z"),
    totalDonatedQuantity: 15,
    totalRevenue: 0,
    generatedAt: new Date(),
  });

  createdIds.donorReports.push(report._id);

  return report;
}

async function createDonorReportItem(donorReportId: string) {
  const item = await DonorReportItem.create({
    donorReportId,
    foodCategory: foodCategory.Fruit,
    measurementUnit: MeasurementUnit.KG,
    donatedQuantity: 5,
    revenue: 0,
    donationCount: 1,
  });

  createdIds.donorReportItems.push(item._id);

  return item;
}

async function testPopulate(
  recipientProfileId: string,
  donorProfileId: string,
  donationId: string,
  reservationId: string,
): Promise<void> {
  const recipientProfile =
    await RecipientProfile.findById(recipientProfileId).populate("userId");

  assert(recipientProfile, "RecipientProfile could not be found");

  assert(
    recipientProfile.userId,
    "RecipientProfile.userId could not be populated",
  );

  const donorProfile =
    await DonorProfile.findById(donorProfileId).populate("userId");

  assert(donorProfile, "DonorProfile could not be found");

  assert(donorProfile.userId, "DonorProfile.userId could not be populated");

  const donation =
    await Donation.findById(donationId).populate("donorProfileId");

  assert(donation, "Donation could not be found");

  assert(
    donation.donorProfileId,
    "Donation.donorProfileId could not be populated",
  );

  const reservation = await Reservation.findById(reservationId)
    .populate("donationId")
    .populate("recipientProfileId");

  assert(reservation, "Reservation could not be found");

  assert(
    reservation.donationId,
    "Reservation.donationId could not be populated",
  );

  assert(
    reservation.recipientProfileId,
    "Reservation.recipientProfileId could not be populated",
  );
}

async function testRequiredValidation(): Promise<void> {
  /*
   * This is expected to fail validation.
   * If it succeeds, User.username may not actually be required.
   */
  const invalidUser = new User({
    email: `invalid-${runId}@example.com`,
    passwordHash: "TEST",
    role: userRole.Recipient,
    accountStatus: AccountStatus.Active,
  });

  const error = invalidUser.validateSync();

  assert(error, "Invalid User unexpectedly passed validation");

  assert(error.errors.username, "User.username does not appear to be required");
}

async function testUniqueUserEmail(): Promise<void> {
  const email = `unique-check-${runId}@example.com`;

  const first = await User.create({
    username: `unique-one-${runId}`,
    email,
    passwordHash: "TEST",
    role: userRole.Recipient,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
  });

  createdIds.users.push(first._id);

  let duplicateRejected = false;

  try {
    const second = await User.create({
      username: `unique-two-${runId}`,
      email,
      passwordHash: "TEST",
      role: userRole.Recipient,
      accountStatus: AccountStatus.Active,
      failedLoginAttemps: 0,
    });

    createdIds.users.push(second._id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      duplicateRejected = true;
    } else {
      throw error;
    }
  }

  assert(duplicateRejected, "Duplicate User.email was not rejected");
}

async function cleanup(): Promise<void> {
  console.log("");
  console.log("Cleaning temporary test data...");

  // Children first, parents last.
  await DonorReportItem.deleteMany({
    _id: { $in: createdIds.donorReportItems },
  });

  await DonorReport.deleteMany({
    _id: { $in: createdIds.donorReports },
  });

  await AuditLog.deleteMany({
    _id: { $in: createdIds.auditLogs },
  });

  await RevokedToken.deleteMany({
    _id: { $in: createdIds.revokedTokens },
  });

  await Notification.deleteMany({
    _id: { $in: createdIds.notifications },
  });

  await Transaction.deleteMany({
    _id: { $in: createdIds.transactions },
  });

  await Reservation.deleteMany({
    _id: { $in: createdIds.reservations },
  });

  await Donation.deleteMany({
    _id: { $in: createdIds.donations },
  });

  await Wallet.deleteMany({
    _id: { $in: createdIds.wallets },
  });

  await NotificationPreference.deleteMany({
    _id: {
      $in: createdIds.notificationPreferences,
    },
  });

  await DonorProfile.deleteMany({
    _id: { $in: createdIds.donorProfiles },
  });

  await RecipientProfile.deleteMany({
    _id: { $in: createdIds.recipientProfiles },
  });

  await User.deleteMany({
    _id: { $in: createdIds.users },
  });

  console.log("Temporary test data removed.");
}

function printSummary(): void {
  const passed = results.filter((result) => result.passed).length;

  const failed = results.length - passed;

  console.log("");
  console.log("===================================");
  console.log("DATABASE / ENTITY TEST SUMMARY");
  console.log("===================================");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${results.length}`);
  console.log("");

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";

    console.log(
      `${status.padEnd(4)}  ${result.name}` +
        (result.details ? ` - ${result.details}` : ""),
    );
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  let adminId = "";
  let donorId = "";
  let recipientId = "";

  let recipientProfileId = "";
  let donorProfileId = "";

  let donationAId = "";
  let donationBId = "";

  let reservationId = "";

  try {
    await connectDatabase();

    await runTest("MongoDB connection and ping", testDatabaseConnection);

    await runTest("Mongoose model indexes initialize correctly", testIndexes);

    await runTest("User required-field validation", testRequiredValidation);

    await runTest("User unique email index", testUniqueUserEmail);

    await runTest("Create User entities", async () => {
      const users = await createUsers();

      adminId = users.admin._id;
      donorId = users.donor._id;
      recipientId = users.recipient._id;
    });

    await runTest("Create RecipientProfile and DonorProfile", async () => {
      assert(donorId && recipientId, "User test must pass first");

      const profiles = await createProfiles(donorId, recipientId);

      recipientProfileId = profiles.recipientProfile._id;

      donorProfileId = profiles.donorProfile._id;
    });

    await runTest("Create NotificationPreference", async () => {
      assert(recipientProfileId, "RecipientProfile test must pass first");

      await createNotificationPreference(recipientProfileId);
    });

    await runTest("Create Wallet", async () => {
      assert(recipientProfileId, "RecipientProfile test must pass first");

      await createWallet(recipientProfileId);
    });

    await runTest(
      "Create multiple Donations for one DonorProfile",
      async () => {
        assert(donorProfileId, "DonorProfile test must pass first");

        const donations = await createDonations(donorProfileId);

        donationAId = donations.donationA._id;
        donationBId = donations.donationB._id;

        assert(donationAId !== donationBId, "Donation UUIDs are not unique");
      },
    );

    await runTest("Create Reservation", async () => {
      assert(
        donationAId && recipientProfileId,
        "Donation/Profile tests must pass first",
      );

      const reservation = await createReservation(
        donationAId,
        recipientProfileId,
      );

      reservationId = reservation._id;
    });

    await runTest("Create Transaction", async () => {
      assert(
        recipientProfileId && reservationId,
        "Reservation/Profile tests must pass first",
      );

      await createTransaction(recipientProfileId, reservationId);
    });

    await runTest("Create Notification", async () => {
      assert(recipientId && donationBId, "User/Donation tests must pass first");

      await createNotification(recipientId, donationBId);
    });

    await runTest("Create RevokedToken", async () => {
      assert(recipientId, "User test must pass first");

      await createRevokedToken(recipientId);
    });

    await runTest("Create AuditLog", async () => {
      assert(adminId && recipientId, "User test must pass first");

      await createAuditLog(adminId, recipientId);
    });

    let donorReportId = "";

    await runTest("Create DonorReport", async () => {
      assert(donorProfileId, "DonorProfile test must pass first");

      const report = await createDonorReport(donorProfileId);

      donorReportId = report._id;
    });

    await runTest("Create DonorReportItem", async () => {
      assert(donorReportId, "DonorReport test must pass first");

      await createDonorReportItem(donorReportId);
    });

    await runTest("Populate core entity relationships", async () => {
      assert(
        recipientProfileId && donorProfileId && donationAId && reservationId,
        "Core entity tests must pass first",
      );

      await testPopulate(
        recipientProfileId,
        donorProfileId,
        donationAId,
        reservationId,
      );
    });
  } catch (error) {
    fail("Unexpected test runner failure", error);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      fail("Cleanup temporary data", error);
    }

    printSummary();

    await mongoose.connection.close();

    console.log("");
    console.log("MongoDB connection closed.");
  }
}

void main();
