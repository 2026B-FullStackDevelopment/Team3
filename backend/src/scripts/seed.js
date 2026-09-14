import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDatabase } from "../config/database.js";

import {
  User,
  userRole,
  AccountStatus,
} from "../modules/identity/models/User.js";

import { RecipientProfile } from "../modules/identity/models/RecipientProfile.js";
import { DonorProfile } from "../modules/identity/models/DonorProfile.js";
import { NotificationPreference } from "../modules/notification/models/NotificationPreference.js";
import { FoodCategory } from "../shared/constants/foodCategory.js";
import { Wallet } from "../modules/wallet/models/Wallet.js";

import {
  Donation,
  MeasurementUnit,
  DonationStatus,
} from "../modules/donation/models/donation.model.js";

import {
  Reservation,
  ReservationStatus,
} from "../modules/reservation/models/Reservation.js";
import { PaymentMethod } from "../shared/constants/paymentMethod.js";

import {
  Transaction,
  TransactionType,
} from "../modules/wallet/models/Transaction.js";

import {
  Notification,
  NotificationType,
} from "../modules/notification/models/Notification.js";

import { RevokedToken } from "../modules/identity/models/RevokedToken.js";

import {
  AuditLog,
  AuditTargetType,
  AdminActionType,
  AuditLogStatus,
} from "../modules/admin/models/AuditLog.js";

import {
  DonorReport,
  ReportType,
} from "../modules/donorReport/models/DonorReport.model.js";

import { DonorReportItem } from "../modules/donorReport/models/DonorReportItem.model.js";

async function clearDatabase() {
  console.log("Clearing existing data...");

  // Delete dependent collections first.
  await DonorReportItem.deleteMany({});
  await DonorReport.deleteMany({});
  await AuditLog.deleteMany({});
  await RevokedToken.deleteMany({});
  await Notification.deleteMany({});
  await Transaction.deleteMany({});
  await Reservation.deleteMany({});
  await Donation.deleteMany({});
  await Wallet.deleteMany({});
  await NotificationPreference.deleteMany({});
  await DonorProfile.deleteMany({});
  await RecipientProfile.deleteMany({});
  await User.deleteMany({});

  console.log("Existing data cleared.");
}

async function seedUsers() {
  console.log("1/13 Seeding User...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await User.create({
    email: "admin@example.com",
    passwordHash,
    role: userRole.Admin,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const donor = await User.create({
    email: "donor@example.com",
    passwordHash,
    role: userRole.Donor,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const recipient = await User.create({
    email: "recipient@example.com",
    passwordHash,
    role: userRole.Recipient,
    accountStatus: AccountStatus.Active,
    failedLoginAttemps: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  return {
    admin,
    donor,
    recipient,
  };
}

async function seedRecipientProfile(userId) {
  console.log("2/13 Seeding RecipientProfile...");

  return RecipientProfile.create({
    userId,
    userName: "TestRecipient",
    city: "Ho Chi Minh City",
    avatarUrl: "https://example.com/images/recipient-avatar.png",
    isPremium: false,
    premiumExpiryDate: null,
  });
}

async function seedDonorProfile(userId) {
  console.log("3/13 Seeding DonorProfile...");

  return DonorProfile.create({
    userId,
    companyName: "Fresh Food Vietnam",
    taxCode: "0312345678",
    city: "Ho Chi Minh City",
    avatarUrl: "https://example.com/images/donor-avatar.png",
    address: "123 Nguyen Hue, District 1, Ho Chi Minh City",

    // GeoJSON Point uses [longitude, latitude].
    location: {
      type: "Point",
      coordinates: [106.7033, 10.7769],
    },
  });
}

async function seedNotificationPreference(recipientProfileId) {
  console.log("4/13 Seeding NotificationPreference...");

  return NotificationPreference.create({
    recipientProfileId,
    foodCategory: [FoodCategory.Fruit, FoodCategory.Vegetable],

    isVegetarian: false,
    priceRangeMin: 0,
    priceRangeMax: 100000,
    city: "Ho Chi Minh City",
  });
}

async function seedWallet(userId) {
  console.log("5/13 Seeding Wallet...");

  return Wallet.create({
    userId,
    balance: 500000,
  });
}

async function seedDonations(donorProfileId) {
  console.log("6/13 Seeding Donation...");

  const bread = await Donation.create({
    donorProfileId,
    name: "Fresh Bread",
    description: "Fresh bread available for same-day collection.",
    imageUrl: "https://example.com/images/fresh-bread.jpg",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: FoodCategory.BakedGoods,
    isVegetarian: true,
    donationLimit: 5,
    price: 0,
    remainingQuantity: 20,
    status: DonationStatus.Active,
    closedAt: null,
  });

  const fruit = await Donation.create({
    donorProfileId,
    name: "Mixed Fresh Fruit",
    description: "Mixed apples, bananas, and oranges.",
    imageUrl: "https://example.com/images/mixed-fresh-fruit.jpg",
    measurementUnit: MeasurementUnit.KG,
    foodCategory: FoodCategory.Fruit,
    isVegetarian: true,
    donationLimit: 3,
    price: 0,
    remainingQuantity: 15,
    status: DonationStatus.Active,
    closedAt: null,
  });

  return {
    bread,
    fruit,
  };
}

async function seedReservations(donationId, recipientProfileId) {
  console.log("7/13 Seeding Reservations...");

  return Reservation.create([
    {
      donationId,
      recipientProfileId,
      manualRecipientName: "Recipient",
      quantity: 2,
      status: ReservationStatus.Reserved,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: null,
      reservedAt: new Date("2026-08-25T09:00:00.000Z"),
      collectedAt: null,
    },
    {
      donationId,
      recipientProfileId: null,
      manualRecipientName: "Nguyen Van An",
      quantity: 1,
      status: ReservationStatus.Collected,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: "Fresh bread and friendly service.",
      reservedAt: null,
      collectedAt: new Date("2026-08-24T10:30:00.000Z"),
    },
    {
      donationId,
      recipientProfileId,
      manualRecipientName: "Recipient",
      quantity: 3,
      status: ReservationStatus.CollectedByRecipient,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: "Collection was quick and easy.",
      reservedAt: new Date("2026-08-23T08:00:00.000Z"),
      collectedAt: new Date("2026-08-23T11:00:00.000Z"),
    },
    {
      donationId,
      recipientProfileId: null,
      manualRecipientName: "Tran Thi Binh",
      quantity: 2,
      status: ReservationStatus.Collected,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: null,
      reservedAt: null,
      collectedAt: new Date("2026-08-22T14:15:00.000Z"),
    },
    {
      donationId,
      recipientProfileId,
      manualRecipientName: "Recipient",
      quantity: 1,
      status: ReservationStatus.CancelledByDonor,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: null,
      reservedAt: new Date("2026-08-21T09:45:00.000Z"),
      collectedAt: null,
    },
    {
      donationId,
      recipientProfileId: null,
      manualRecipientName: "Le Minh Chau",
      quantity: 4,
      status: ReservationStatus.Collected,
      totalPaid: 0,
      paymentMethod: PaymentMethod.Cash,
      feedback: "Very helpful donation.",
      reservedAt: null,
      collectedAt: new Date("2026-08-20T16:00:00.000Z"),
    },
  ]);
}

async function seedTransaction(userId, reservationId) {
  console.log("8/13 Seeding Transaction...");

  return Transaction.create({
    userId,
    type: TransactionType.FoodPurchase,
    amount: 0,
    method: PaymentMethod.Cash,
    relatedReservationId: reservationId,
    createdAt: new Date(),
  });
}

async function seedNotification(userId, donationId) {
  console.log("9/13 Seeding Notification...");

  return Notification.create({
    userId,
    type: NotificationType.ListingMatched,
    relatedDonationId: donationId,
  });
}

async function seedRevokedToken(userId) {
  console.log("10/13 Seeding RevokedToken...");

  return RevokedToken.create({
    jti: "example-revoked-token-jti",
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

async function seedAuditLog(adminId, targetUserId) {
  console.log("11/13 Seeding AuditLog...");

  return AuditLog.create({
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
}

async function seedDonorReport(donorProfileId) {
  console.log("12/13 Seeding DonorReport...");

  return DonorReport.create({
    donorProfileId,
    reportType: ReportType.ByCategory,
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T23:59:59.999Z"),
    totalDonatedQuantity: 35,
    totalRevenue: 0,
    generatedAt: new Date(),
  });
}

async function seedDonorReportItems(donorReportId) {
  console.log("13/13 Seeding DonorReportItem...");

  const breadItem = await DonorReportItem.create({
    donorReportId,
    foodCategory: FoodCategory.BakedGoods,
    measurementUnit: MeasurementUnit.Unit,
    donatedQuantity: 20,
    revenue: 0,
    donationCount: 1,
  });

  const fruitItem = await DonorReportItem.create({
    donorReportId,
    foodCategory: FoodCategory.Fruit,
    measurementUnit: MeasurementUnit.KG,
    donatedQuantity: 15,
    revenue: 0,
    donationCount: 1,
  });

  return {
    breadItem,
    fruitItem,
  };
}

async function seed() {
  try {
    await connectDatabase();

    console.log("MongoDB connected.");

    await clearDatabase();

    // 1. User
    const { admin, donor, recipient } = await seedUsers();

    // 2. RecipientProfile -> User
    const recipientProfile = await seedRecipientProfile(recipient._id);

    // 3. DonorProfile -> User
    const donorProfile = await seedDonorProfile(donor._id);

    // 4. NotificationPreference -> RecipientProfile
    await seedNotificationPreference(recipientProfile._id);

    // 5. Wallet -> User
    await seedWallet(recipient._id);

    // 6. Donation -> DonorProfile
    const { bread, fruit } = await seedDonations(donorProfile._id);

    // 7. Reservation -> Donation + RecipientProfile
    const reservations = await seedReservations(
      bread._id,
      recipientProfile._id,
    );
    const [reservation] = reservations;

    // 8. Transaction -> User + Reservation
    await seedTransaction(recipient._id, reservation._id);

    // 9. Notification -> User + Donation
    await seedNotification(recipient._id, fruit._id);

    // 10. RevokedToken -> User
    await seedRevokedToken(recipient._id);

    // 11. AuditLog -> User / polymorphic target
    await seedAuditLog(admin._id, recipient._id);

    // 12. DonorReport -> DonorProfile
    const donorReport = await seedDonorReport(donorProfile._id);

    // 13. DonorReportItem -> DonorReport
    await seedDonorReportItems(donorReport._id);

    console.log("");
    console.log("================================");
    console.log("DATABASE SEED COMPLETED");
    console.log("================================");
    console.log(`Admin user: ${admin._id}`);
    console.log(`Donor user: ${donor._id}`);
    console.log(`Recipient user: ${recipient._id}`);
    console.log(`Donor profile: ${donorProfile._id}`);
    console.log(`Recipient profile: ${recipientProfile._id}`);
    console.log(`Bread donation: ${bread._id}`);
    console.log(`Fruit donation: ${fruit._id}`);
    console.log(`Reservation: ${reservation._id}`);
    console.log(`Bread donation records: ${reservations.length}`);
    console.log(`Donor report: ${donorReport._id}`);
  } catch (error) {
    console.error("Database seed failed:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

void seed();
