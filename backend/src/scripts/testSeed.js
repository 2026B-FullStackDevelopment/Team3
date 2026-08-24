import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";

import { User, userRole, AccountStatus } from "../modules/users/models/User.js";

import { RecipientProfile } from "../modules/users/models/RecipientProfile.js";

import { DonorProfile } from "../modules/users/models/DonorProfile.js";

import {
  NotificationPreference,
  foodCategory,
} from "../modules/notifications/models/NotificationPreference.js";

import { Wallet } from "../modules/wallet/models/Wallet.js";

import {
  Donation,
  MeasurementUnit,
  DonationStatus,
} from "../modules/donations/models/donation.js";

import {
  Reservation,
  ReservationStatus,
  PaymentMethod,
} from "../modules/donations/models/Reservation.js";

import { Transaction, TransactionType } from "../modules/wallet/models/Transaction.js";

import { Notification, NotificationType } from "../modules/notifications/models/Notification.js";

import { RevokedToken } from "../modules/users/models/RevokedToken.js";

import {
  AuditLog,
  AuditTargetType,
  AdminActionType,
  AuditLogStatus,
} from "../modules/auditLog/models/AuditLog.js";

import { DonorReport, ReportType } from "../modules/donorReports/models/DonorReport.js";

import { DonorReportItem } from "../modules/donorReports/models/DonorReportItem.js";

const results = [];

/**
 * IMPORTANT
 * ---------
 * This test writes temporary documents to the connected database.
 *
 * Every inserted test document uses a unique timestamp-based suffix,
 * and cleanup runs in finally().
 *
 * It DOES NOT call deleteMany({}) on the whole database.
 */

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createdIds = {
  users: [],
  recipientProfiles: [],
  donorProfiles: [],
  notificationPreferences: [],
  wallets: [],
  donations: [],
  reservations: [],
  transactions: [],
  notifications: [],
  revokedTokens: [],
  auditLogs: [],
  donorReports: [],
  donorReportItems: [],
};

/**
 * Record a passed test.
 */
function pass(name, details) {
  results.push({
    name,
    passed: true,
  });

  console.log(`PASS  ${name}${details ? ` - ${details}` : ""}`);
}

/**
 * Record a failed test.
 */
function fail(name, error) {
  const details = error instanceof Error ? error.message : String(error);

  results.push({
    name,
    passed: false,
    details,
  });

  console.error(`FAIL  ${name} - ${details}`);
}

/**
 * Execute one test without stopping the whole test suite
 * when the test fails.
 */
async function runTest(name, fn) {
  try {
    await fn();

    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

/**
 * Small assertion helper.
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Test MongoDB connection.
 */
async function testDatabaseConnection() {
  assert(
    mongoose.connection.readyState === 1,
    `Expected readyState 1, got ${mongoose.connection.readyState}`,
  );

  assert(mongoose.connection.db, "MongoDB database object is unavailable");

  await mongoose.connection.db.admin().ping();
}

/**
 * Initialize model indexes and verify important indexes.
 */
async function testIndexes() {
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

/**
 * Create temporary Admin, Donor, and Recipient users.
 */
async function createUsers() {
  const admin = await User.create({
    email: `test-admin-${runId}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_HASH",

    role: userRole.Admin,
    accountStatus: AccountStatus.Active,

    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const donor = await User.create({
    email: `test-donor-${runId}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_HASH",

    role: userRole.Donor,
    accountStatus: AccountStatus.Active,

    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const recipient = await User.create({
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

/**
 * Create temporary RecipientProfile and DonorProfile.
 */
async function createProfiles(donorUserId, recipientUserId) {
  const recipientProfile = await RecipientProfile.create({
    userId: recipientUserId,
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

      // GeoJSON coordinates are:
      // [longitude, latitude]
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

/**
 * Create recipient notification preference.
 */
async function createNotificationPreference(recipientProfileId) {
  const preference = await NotificationPreference.create({
    recipientProfileId,

    // Adjust enum names here if your model differs.
    foodCategory: [foodCategory.Fruit],

    isVegetarian: false,

    priceRangeMin: 0,
    priceRangeMax: 100000,

    city: "Ho Chi Minh City",
  });

  createdIds.notificationPreferences.push(preference._id);

  return preference;
}

/**
 * Create recipient wallet.
 */
async function createWallet(recipientProfileId) {
  const wallet = await Wallet.create({
    recipientProfileId,
    balance: 100000,
  });

  createdIds.wallets.push(wallet._id);

  return wallet;
}

/**
 * Create two donations belonging to the same donor.
 */
async function createDonations(donorProfileId) {
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

  /**
   * Creating TWO donations with the same
   * donorProfileId deliberately tests that
   * donorProfileId is NOT accidentally unique.
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

/**
 * Create Reservation.
 */
async function createReservation(donationId, recipientProfileId) {
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

/**
 * Create Transaction associated with reservation.
 */
async function createTransaction(recipientProfileId, reservationId) {
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

/**
 * Create Notification.
 */
async function createNotification(userId, donationId) {
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

/**
 * Create revoked JWT record.
 */
async function createRevokedToken(userId) {
  const token = await RevokedToken.create({
    jti: `test-token-${runId}`,

    userId,

    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  createdIds.revokedTokens.push(token._id);

  return token;
}

/**
 * Create Admin audit log.
 */
async function createAuditLog(adminId, targetUserId) {
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

/**
 * Create donor report.
 */
async function createDonorReport(donorProfileId) {
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

/**
 * Create donor report item.
 */
async function createDonorReportItem(donorReportId) {
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

/**
 * Test Mongoose populate relationships.
 */
async function testPopulate(
  recipientProfileId,
  donorProfileId,
  donationId,
  reservationId,
) {
  /*
   * RecipientProfile -> User
   */

  const recipientProfile =
    await RecipientProfile.findById(recipientProfileId).populate("userId");

  assert(recipientProfile, "RecipientProfile could not be found");

  assert(
    recipientProfile.userId,

    "RecipientProfile.userId could not be populated",
  );

  /*
   * DonorProfile -> User
   */

  const donorProfile =
    await DonorProfile.findById(donorProfileId).populate("userId");

  assert(donorProfile, "DonorProfile could not be found");

  assert(
    donorProfile.userId,

    "DonorProfile.userId could not be populated",
  );

  /*
   * Donation -> DonorProfile
   */

  const donation =
    await Donation.findById(donationId).populate("donorProfileId");

  assert(donation, "Donation could not be found");

  assert(
    donation.donorProfileId,

    "Donation.donorProfileId could not be populated",
  );

  /*
   * Reservation
   * -> Donation
   * -> RecipientProfile
   */

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

/**
 * Test required field validation.
 */
async function testRequiredValidation() {
  /**
   * This document is expected
   * to FAIL validation.
   *
   * Username is deliberately
   * omitted.
   */

  const invalidUser = new User({
    email: `invalid-${runId}@example.com`,

    passwordHash: "TEST",

    role: userRole.Recipient,

    accountStatus: AccountStatus.Active,
  });

  const error = invalidUser.validateSync();

  assert(
    error,

    "Invalid User unexpectedly passed validation",
  );

  assert(
    error.errors.username,

    "User.username does not appear to be required",
  );
}

/**
 * Test unique email constraint.
 */
async function testUniqueUserEmail() {
  const email = `unique-check-${runId}@example.com`;

  const first = await User.create({
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
      email,

      passwordHash: "TEST",

      role: userRole.Recipient,

      accountStatus: AccountStatus.Active,

      failedLoginAttemps: 0,
    });

    createdIds.users.push(second._id);
  } catch (error) {
    /*
     * MongoDB duplicate-key
     * error code is 11000.
     */

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

  assert(
    duplicateRejected,

    "Duplicate User.email was not rejected",
  );
}

/**
 * Remove ONLY the temporary documents
 * created by this test.
 */
async function cleanup() {
  console.log("");

  console.log("Cleaning temporary test data...");

  /*
   * Children first,
   * parent entities last.
   */

  await DonorReportItem.deleteMany({
    _id: {
      $in: createdIds.donorReportItems,
    },
  });

  await DonorReport.deleteMany({
    _id: {
      $in: createdIds.donorReports,
    },
  });

  await AuditLog.deleteMany({
    _id: {
      $in: createdIds.auditLogs,
    },
  });

  await RevokedToken.deleteMany({
    _id: {
      $in: createdIds.revokedTokens,
    },
  });

  await Notification.deleteMany({
    _id: {
      $in: createdIds.notifications,
    },
  });

  await Transaction.deleteMany({
    _id: {
      $in: createdIds.transactions,
    },
  });

  await Reservation.deleteMany({
    _id: {
      $in: createdIds.reservations,
    },
  });

  await Donation.deleteMany({
    _id: {
      $in: createdIds.donations,
    },
  });

  await Wallet.deleteMany({
    _id: {
      $in: createdIds.wallets,
    },
  });

  await NotificationPreference.deleteMany({
    _id: {
      $in: createdIds.notificationPreferences,
    },
  });

  await DonorProfile.deleteMany({
    _id: {
      $in: createdIds.donorProfiles,
    },
  });

  await RecipientProfile.deleteMany({
    _id: {
      $in: createdIds.recipientProfiles,
    },
  });

  await User.deleteMany({
    _id: {
      $in: createdIds.users,
    },
  });

  console.log("Temporary test data removed.");
}

/**
 * Print final test result.
 */
function printSummary() {
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

  /*
   * Let CI / terminal know
   * that something failed.
   */

  if (failed > 0) {
    process.exitCode = 1;
  }
}

/**
 * Main test runner.
 */
async function main() {
  let adminId = "";

  let donorId = "";

  let recipientId = "";

  let recipientProfileId = "";

  let donorProfileId = "";

  let donationAId = "";

  let donationBId = "";

  let reservationId = "";

  try {
    /*
     * Connect to MongoDB.
     */

    await connectDatabase();

    /*
     * Database connection.
     */

    await runTest("MongoDB connection and ping", testDatabaseConnection);

    /*
     * Index initialization.
     */

    await runTest("Mongoose model indexes initialize correctly", testIndexes);

    /*
     * Required field validation.
     */

    await runTest("User required-field validation", testRequiredValidation);

    /*
     * Unique email validation.
     */

    await runTest("User unique email index", testUniqueUserEmail);

    /*
     * Users.
     */

    await runTest("Create User entities", async () => {
      const users = await createUsers();

      adminId = users.admin._id;

      donorId = users.donor._id;

      recipientId = users.recipient._id;
    });

    /*
     * Profiles.
     */

    await runTest("Create RecipientProfile and DonorProfile", async () => {
      assert(
        donorId && recipientId,

        "User test must pass first",
      );

      const profiles = await createProfiles(donorId, recipientId);

      recipientProfileId = profiles.recipientProfile._id;

      donorProfileId = profiles.donorProfile._id;
    });

    /*
     * Notification preference.
     */

    await runTest("Create NotificationPreference", async () => {
      assert(
        recipientProfileId,

        "RecipientProfile test must pass first",
      );

      await createNotificationPreference(recipientProfileId);
    });

    /*
     * Wallet.
     */

    await runTest("Create Wallet", async () => {
      assert(
        recipientProfileId,

        "RecipientProfile test must pass first",
      );

      await createWallet(recipientProfileId);
    });

    /*
     * Donations.
     */

    await runTest(
      "Create multiple Donations for one DonorProfile",
      async () => {
        assert(
          donorProfileId,

          "DonorProfile test must pass first",
        );

        const donations = await createDonations(donorProfileId);

        donationAId = donations.donationA._id;

        donationBId = donations.donationB._id;

        assert(
          donationAId !== donationBId,

          "Donation UUIDs are not unique",
        );
      },
    );

    /*
     * Reservation.
     */

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

    /*
     * Transaction.
     */

    await runTest("Create Transaction", async () => {
      assert(
        recipientProfileId && reservationId,

        "Reservation/Profile tests must pass first",
      );

      await createTransaction(recipientProfileId, reservationId);
    });

    /*
     * Notification.
     */

    await runTest("Create Notification", async () => {
      assert(
        recipientId && donationBId,

        "User/Donation tests must pass first",
      );

      await createNotification(recipientId, donationBId);
    });

    /*
     * Revoked JWT.
     */

    await runTest("Create RevokedToken", async () => {
      assert(
        recipientId,

        "User test must pass first",
      );

      await createRevokedToken(recipientId);
    });

    /*
     * Audit Log.
     */

    await runTest("Create AuditLog", async () => {
      assert(
        adminId && recipientId,

        "User test must pass first",
      );

      await createAuditLog(adminId, recipientId);
    });

    /*
     * Donor Report.
     */

    let donorReportId = "";

    await runTest("Create DonorReport", async () => {
      assert(
        donorProfileId,

        "DonorProfile test must pass first",
      );

      const report = await createDonorReport(donorProfileId);

      donorReportId = report._id;
    });

    /*
     * Donor Report Item.
     */

    await runTest("Create DonorReportItem", async () => {
      assert(
        donorReportId,

        "DonorReport test must pass first",
      );

      await createDonorReportItem(donorReportId);
    });

    /*
     * Populate relationships.
     */

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
    /*
     * Always clean temporary data,
     * even when a test fails.
     */

    try {
      await cleanup();
    } catch (error) {
      fail("Cleanup temporary data", error);
    }

    /*
     * Print test results.
     */

    printSummary();

    /*
     * Close database connection.
     */

    await mongoose.connection.close();

    console.log("");

    console.log("MongoDB connection closed.");
  }
}

main();
