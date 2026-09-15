import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import {
  AuditLog,
  AuditLogStatus,
  AdminActionType,
  AuditTargetType,
} from "../modules/admin/models/AuditLog.js";
import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../modules/donation/models/donation.model.js";
import {
  DonorReport,
  ReportType,
} from "../modules/donorReport/models/DonorReport.model.js";
import { DonorReportItem } from "../modules/donorReport/models/DonorReportItem.model.js";
import { DonorProfile } from "../modules/identity/models/DonorProfile.js";
import { RecipientProfile } from "../modules/identity/models/RecipientProfile.js";
import { RevokedToken } from "../modules/identity/models/RevokedToken.js";
import {
  AccountStatus,
  User,
  userRole,
} from "../modules/identity/models/User.js";
import {
  Notification,
  NotificationType,
} from "../modules/notification/models/Notification.js";
import { NotificationPreference } from "../modules/notification/models/NotificationPreference.js";
import {
  Reservation,
  ReservationStatus,
} from "../modules/reservation/models/Reservation.js";
import {
  Transaction,
  TransactionType,
} from "../modules/wallet/models/Transaction.js";
import { Wallet } from "../modules/wallet/models/Wallet.js";
import { FoodCategory } from "../shared/constants/foodCategory.js";
import { PaymentMethod } from "../shared/constants/paymentMethod.js";
import { putObject } from "../shared/upload/services/objectStore.js";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REAL_IMAGES_DIRECTORY = join(SCRIPT_DIRECTORY, "real-images");
const DEMO_PASSWORD = "FoodShare2026!";
const STARTING_WALLET_BALANCE = 1_000_000;

const recipientFixtures = [
  {
    key: "minhAnh",
    email: "minh.anh@aff.com",
    userName: "minh_anh",
    city: "Ho Chi Minh City",
    isPremium: true,
    premiumExpiryDate: new Date("2026-12-31T23:59:59.999Z"),
  },
  {
    key: "quocBao",
    email: "quoc.bao@aff.com",
    userName: "quoc_bao",
    city: "Hanoi",
    isPremium: false,
    premiumExpiryDate: null,
  },
  {
    key: "thuHa",
    email: "thu.ha@aff.com",
    userName: "thu_ha",
    city: "Da Nang",
    isPremium: false,
    premiumExpiryDate: null,
  },
  {
    key: "giaHuy",
    email: "gia.huy@aff.com",
    userName: "gia_huy",
    city: "Can Tho",
    isPremium: true,
    premiumExpiryDate: new Date("2027-03-31T23:59:59.999Z"),
  },
  {
    key: "ngocLan",
    email: "ngoc.lan@aff.com",
    userName: "ngoc_lan",
    city: "Hai Phong",
    isPremium: false,
    premiumExpiryDate: null,
  },
  {
    key: "ducMinh",
    email: "duc.minh@aff.com",
    userName: "duc_minh",
    city: "Lam Dong",
    isPremium: false,
    premiumExpiryDate: null,
  },
];

const donorFixtures = [
  {
    key: "bepViet",
    email: "bep.viet@aff.com",
    companyName: "Bếp Việt Sẻ Chia",
    taxCode: "0318457201",
    city: "Ho Chi Minh City",
    address: "28 Nguyễn Cơ Thạch, Thủ Đức, Ho Chi Minh City",
    coordinates: [106.7234, 10.7866],
    avatarFile: "person_1.jpg",
  },
  {
    key: "nongSanAnLanh",
    email: "nong.san.an.lanh@aff.com",
    companyName: "Nông Sản An Lành",
    taxCode: "0109684312",
    city: "Hanoi",
    address: "56 Trần Thái Tông, Cầu Giấy, Hanoi",
    coordinates: [105.7905, 21.0338],
    avatarFile: "person_2.jpg",
  },
  {
    key: "comNhaAmAp",
    email: "com.nha.am.ap@aff.com",
    companyName: "Cơm Nhà Ấm Áp",
    taxCode: "0402196843",
    city: "Da Nang",
    address: "91 Nguyễn Văn Linh, Hải Châu, Da Nang",
    coordinates: [108.2137, 16.0595],
    avatarFile: "person_3.jpg",
  },
  {
    key: "thucPhamMinhTam",
    email: "thuc.pham.minh.tam@aff.com",
    companyName: "Thực Phẩm Minh Tâm",
    taxCode: "1801742956",
    city: "Can Tho",
    address: "14 đường 30 Tháng 4, Ninh Kiều, Can Tho",
    coordinates: [105.7795, 10.0341],
    avatarFile: "person_4.jpg",
  },
  {
    key: "suatAnHuongDuong",
    email: "suat.an.huong.duong@aff.com",
    companyName: "Suất Ăn Hướng Dương",
    taxCode: "0202248175",
    city: "Hai Phong",
    address: "33 Lạch Tray, Ngô Quyền, Hai Phong",
    coordinates: [106.6881, 20.8449],
    avatarFile: "person_5.jpg",
  },
  {
    key: "bepNhanAiDaLat",
    email: "bep.nhan.ai.da.lat@aff.com",
    companyName: "Bếp Nhân Ái Đà Lạt",
    taxCode: "5801529634",
    city: "Lam Dong",
    address: "72 Phan Đình Phùng, Đà Lạt, Lam Dong",
    coordinates: [108.4369, 11.9465],
    avatarFile: "person_6.jpg",
  },
];

const donationFixtures = [
  {
    key: "friedMackerel",
    donorKey: "bepViet",
    recipientKey: "minhAnh",
    name: "Cá thu chiên sốt cà",
    description:
      "Cá thu chiên sốt cà được đóng hộp trong ngày, phù hợp cho bữa trưa gia đình.",
    imageFile: "ca_thu_chien.jpg",
    measurementUnit: MeasurementUnit.KG,
    foodCategory: FoodCategory.CookedDish,
    isVegetarian: false,
    donationLimit: 12,
    donatedQuantity: 2.5,
    ration: 3,
    price: 180_000,
    paymentMethod: PaymentMethod.Cash,
    createdAt: new Date("2026-01-10T02:00:00.000Z"),
    reservedAt: new Date("2026-01-12T03:15:00.000Z"),
    collectedAt: new Date("2026-01-12T05:00:00.000Z"),
    feedback: "Cá còn nóng, đóng gói chắc chắn và đúng giờ hẹn.",
  },
  {
    key: "mustardGreenSoup",
    donorKey: "nongSanAnLanh",
    recipientKey: "quocBao",
    name: "Canh cải xanh nấu thịt",
    description:
      "Canh cải xanh nấu trong buổi sáng, chia theo hộp một lít để dễ vận chuyển.",
    imageFile: "canh_cai.jpg",
    measurementUnit: MeasurementUnit.L,
    foodCategory: FoodCategory.CookedDish,
    isVegetarian: false,
    donationLimit: 30,
    donatedQuantity: 6,
    ration: 6,
    price: 30_000,
    paymentMethod: PaymentMethod.Wallet,
    createdAt: new Date("2026-03-05T01:30:00.000Z"),
    reservedAt: new Date("2026-03-06T02:00:00.000Z"),
    collectedAt: new Date("2026-03-06T04:10:00.000Z"),
    feedback: "Canh vừa vị, phần ăn đầy đặn và còn ấm khi nhận.",
  },
  {
    key: "herbChicken",
    donorKey: "comNhaAmAp",
    recipientKey: "thuHa",
    name: "Gà quay thảo mộc",
    description:
      "Gà quay thảo mộc chế biến trong ngày, đã chia thành phần nhỏ để nhận thuận tiện.",
    imageFile: "chicken.jpg",
    measurementUnit: MeasurementUnit.KG,
    foodCategory: FoodCategory.Meat,
    isVegetarian: false,
    donationLimit: 20,
    donatedQuantity: 3,
    ration: 3,
    price: 160_000,
    paymentMethod: PaymentMethod.Card,
    createdAt: new Date("2026-05-12T02:15:00.000Z"),
    reservedAt: new Date("2026-05-13T03:30:00.000Z"),
    collectedAt: new Date("2026-05-13T05:20:00.000Z"),
    feedback: "Thịt gà mềm, thơm và phần nhận đúng như mô tả.",
  },
  {
    key: "vegetableFriedRice",
    donorKey: "thucPhamMinhTam",
    recipientKey: "giaHuy",
    name: "Cơm chiên rau củ",
    description:
      "Cơm chiên rau củ ít dầu, đóng từng suất và thích hợp cho người ăn chay.",
    imageFile: "com_chien.png",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: FoodCategory.CookedDish,
    isVegetarian: true,
    donationLimit: 50,
    donatedQuantity: 8,
    ration: 8,
    price: 35_000,
    paymentMethod: PaymentMethod.Cash,
    createdAt: new Date("2026-07-09T01:45:00.000Z"),
    reservedAt: new Date("2026-07-10T02:20:00.000Z"),
    collectedAt: new Date("2026-07-10T04:00:00.000Z"),
    feedback: "Cơm không nhiều dầu, rau củ tươi và nhận hàng nhanh.",
  },
  {
    key: "brokenRice",
    donorKey: "suatAnHuongDuong",
    recipientKey: "ngocLan",
    name: "Cơm tấm sườn nướng",
    description:
      "Cơm tấm sườn nướng kèm rau và nước mắm, chuẩn bị theo suất riêng.",
    imageFile: "com_tam.jpg",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: FoodCategory.CookedDish,
    isVegetarian: false,
    donationLimit: 60,
    donatedQuantity: 6,
    ration: 6,
    price: 55_000,
    paymentMethod: PaymentMethod.Wallet,
    createdAt: new Date("2026-09-17T02:30:00.000Z"),
    reservedAt: new Date("2026-09-18T03:00:00.000Z"),
    collectedAt: new Date("2026-09-18T05:15:00.000Z"),
    feedback: "Suất cơm đầy đủ, sườn ngon và nhân viên hỗ trợ nhiệt tình.",
  },
  {
    key: "gingerChickenPorridge",
    donorKey: "bepNhanAiDaLat",
    recipientKey: "ducMinh",
    name: "Cháo gà hành gừng",
    description:
      "Cháo gà nấu trong ngày, chia từng phần có nắp kín và phù hợp cho người lớn tuổi.",
    imageFile: "porridge.jpg",
    measurementUnit: MeasurementUnit.Unit,
    foodCategory: FoodCategory.CookedDish,
    isVegetarian: false,
    donationLimit: 45,
    donatedQuantity: 10,
    ration: 10,
    price: 25_000,
    paymentMethod: PaymentMethod.Cash,
    createdAt: new Date("2026-12-02T01:15:00.000Z"),
    reservedAt: new Date("2026-12-03T02:10:00.000Z"),
    collectedAt: new Date("2026-12-03T04:30:00.000Z"),
    feedback: "Cháo thơm, dễ ăn và được chuẩn bị rất sạch sẽ.",
  },
];

function toMap(entries) {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function validateFixtures() {
  assert.equal(recipientFixtures.length, 6);
  assert.equal(donorFixtures.length, 6);
  assert.equal(donationFixtures.length, 6);
  assert.equal(donationFixtures[0].createdAt.getUTCMonth(), 0);
  assert.equal(donationFixtures.at(-1).createdAt.getUTCMonth(), 11);

  const recipientKeys = new Set(recipientFixtures.map(({ key }) => key));
  const donorKeys = new Set(donorFixtures.map(({ key }) => key));
  for (const fixture of donationFixtures) {
    assert(donorKeys.has(fixture.donorKey));
    assert(recipientKeys.has(fixture.recipientKey));
    assert(fixture.donatedQuantity > 0);
    assert(fixture.donatedQuantity <= fixture.donationLimit);
    assert(fixture.ration === 0 || fixture.donatedQuantity <= fixture.ration);
    assert(fixture.price >= 0);
    assert(fixture.createdAt < fixture.reservedAt);
    assert(fixture.reservedAt < fixture.collectedAt);
  }
}

async function uploadImageFile(filePath, folder) {
  const buffer = await readFile(filePath);
  const { name } = parse(filePath);
  const { url } = await putObject({
    key: `${name}`,
    folder,
    buffer,
  });
  return url;
}

async function uploadSeedImages() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error(
      "CLOUDINARY_URL is required to upload the real seed images. The database has not been cleared.",
    );
  }

  console.log("Uploading real seed images...");
  const donorAvatarEntries = await Promise.all(
    donorFixtures.map(async ({ key, avatarFile }) => [
      key,
      await uploadImageFile(
        join(REAL_IMAGES_DIRECTORY, "donation-avatar", avatarFile),
        "avatars",
      ),
    ]),
  );
  const donationImageEntries = await Promise.all(
    donationFixtures.map(async ({ key, imageFile }) => [
      key,
      await uploadImageFile(
        join(REAL_IMAGES_DIRECTORY, "donations", "food-donations", imageFile),
        "donation",
      ),
    ]),
  );

  console.log("Real seed images uploaded.");
  return {
    donorAvatarUrls: new Map(donorAvatarEntries),
    donationImageUrls: new Map(donationImageEntries),
  };
}

async function clearDatabase() {
  console.log("Clearing existing data...");
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

async function seedUsers(passwordHash) {
  console.log("1/11 Seeding users...");
  const admin = await User.create({
    email: "admin@aff.com",
    passwordHash,
    role: userRole.Admin,
    accountStatus: AccountStatus.Active,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastFailedLoginAt: null,
  });

  const recipientUsers = await User.create(
    recipientFixtures.map(({ email }) => ({
      email,
      passwordHash,
      role: userRole.Recipient,
      accountStatus: AccountStatus.Active,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLoginAt: null,
    })),
  );
  const donorUsers = await User.create(
    donorFixtures.map(({ email }) => ({
      email,
      passwordHash,
      role: userRole.Donor,
      accountStatus: AccountStatus.Active,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLoginAt: null,
    })),
  );

  return { admin, recipientUsers, donorUsers };
}

async function seedProfiles(recipientUsers, donorUsers, donorAvatarUrls) {
  console.log("2/11 Seeding recipient and donor profiles...");
  const recipientProfiles = await RecipientProfile.create(
    recipientFixtures.map((fixture, index) => ({
      userId: recipientUsers[index]._id,
      userName: fixture.userName,
      city: fixture.city,
      avatarUrl: null,
      isPremium: fixture.isPremium,
      premiumExpiryDate: fixture.premiumExpiryDate,
    })),
  );
  const donorProfiles = await DonorProfile.create(
    donorFixtures.map((fixture, index) => ({
      userId: donorUsers[index]._id,
      companyName: fixture.companyName,
      taxCode: fixture.taxCode,
      city: fixture.city,
      address: fixture.address,
      avatarUrl: donorAvatarUrls.get(fixture.key),
      location: {
        type: "Point",
        coordinates: fixture.coordinates,
      },
    })),
  );

  return {
    recipientProfiles: toMap(
      recipientFixtures.map((fixture, index) => ({
        key: fixture.key,
        profile: recipientProfiles[index],
        user: recipientUsers[index],
      })),
    ),
    donorProfiles: toMap(
      donorFixtures.map((fixture, index) => ({
        key: fixture.key,
        profile: donorProfiles[index],
        user: donorUsers[index],
      })),
    ),
  };
}

async function seedRecipientFeatures(recipientProfiles) {
  console.log("3/11 Seeding preferences and wallets...");
  await NotificationPreference.create(
    recipientFixtures.map((fixture, index) => ({
      recipientProfileId: recipientProfiles.get(fixture.key).profile._id,
      foodCategory:
        index === 3
          ? [FoodCategory.CookedDish, FoodCategory.Vegetable]
          : [FoodCategory.CookedDish, FoodCategory.Meat],
      isVegetarian: index === 3,
      priceRangeMin: 0,
      priceRangeMax: index === 3 ? 60_000 : 200_000,
      city: fixture.city,
    })),
  );

  const walletSpending = new Map(
    donationFixtures
      .filter(({ paymentMethod }) => paymentMethod === PaymentMethod.Wallet)
      .map((fixture) => [
        fixture.recipientKey,
        fixture.price * fixture.donatedQuantity,
      ]),
  );
  await Wallet.create(
    recipientFixtures.map((fixture) => ({
      userId: recipientProfiles.get(fixture.key).user._id,
      balance: STARTING_WALLET_BALANCE - (walletSpending.get(fixture.key) ?? 0),
    })),
  );
}

async function seedDonations(donorProfiles, donationImageUrls) {
  console.log("4/11 Seeding donations...");
  const donations = await Donation.create(
    donationFixtures.map((fixture) => ({
      donorProfileId: donorProfiles.get(fixture.donorKey).profile._id,
      name: fixture.name,
      description: fixture.description,
      imageUrl: donationImageUrls.get(fixture.key),
      measurementUnit: fixture.measurementUnit,
      foodCategory: fixture.foodCategory,
      isVegetarian: fixture.isVegetarian,
      donationLimit: fixture.donationLimit,
      price: fixture.price,
      remainingQuantity: fixture.donationLimit - fixture.donatedQuantity,
      ration: fixture.ration,
      status: DonationStatus.Active,
      revenue: fixture.price * fixture.donatedQuantity,
      createdAt: fixture.createdAt,
      closedAt: null,
    })),
  );

  return toMap(
    donationFixtures.map((fixture, index) => ({
      key: fixture.key,
      donation: donations[index],
    })),
  );
}

async function seedReservations(donations, recipientProfiles) {
  console.log("5/11 Seeding six connected reservations...");
  const reservations = await Reservation.create(
    donationFixtures.map((fixture) => ({
      donationId: donations.get(fixture.key).donation._id,
      recipientProfileId: recipientProfiles.get(fixture.recipientKey).profile
        ._id,
      manualRecipientName: recipientProfiles.get(fixture.recipientKey).profile
        .userName,
      quantity: fixture.donatedQuantity,
      status: ReservationStatus.Collected,
      totalPaid: fixture.price * fixture.donatedQuantity,
      paymentMethod: fixture.paymentMethod,
      feedback: fixture.feedback,
      reservedAt: fixture.reservedAt,
      collectedAt: fixture.collectedAt,
    })),
  );

  return toMap(
    donationFixtures.map((fixture, index) => ({
      key: fixture.key,
      reservation: reservations[index],
    })),
  );
}

async function seedTransactions(reservations, recipientProfiles) {
  console.log("6/11 Seeding wallet transactions...");
  const walletFixtures = donationFixtures.filter(
    ({ paymentMethod }) => paymentMethod === PaymentMethod.Wallet,
  );
  await Transaction.create(
    walletFixtures.map((fixture) => ({
      userId: recipientProfiles.get(fixture.recipientKey).user._id,
      type: TransactionType.FoodPurchase,
      amount: fixture.price * fixture.donatedQuantity,
      method: PaymentMethod.Wallet,
      relatedReservationId: reservations.get(fixture.key).reservation._id,
      createdAt: fixture.collectedAt,
      updatedAt: fixture.collectedAt,
    })),
  );
}

async function seedNotifications(donations, recipientProfiles) {
  console.log("7/11 Seeding connected notifications...");
  await Notification.create(
    donationFixtures.map((fixture, index) => {
      const userId = recipientProfiles.get(fixture.recipientKey).user._id;
      const donationId = donations.get(fixture.key).donation._id;
      return {
        userId,
        type: NotificationType.ListingMatched,
        relatedDonationId: donationId,
        dedupeKey: `${NotificationType.ListingMatched}:${donationId}:${userId}`,
        isRead: index % 2 === 0,
        createdAt: new Date(fixture.createdAt.getTime() + 60 * 60 * 1000),
      };
    }),
  );
}

async function seedDonorReports(donations, donorProfiles) {
  console.log("8/11 Seeding connected donor reports...");
  for (const fixture of donationFixtures) {
    const donorProfileId = donorProfiles.get(fixture.donorKey).profile._id;
    const report = await DonorReport.create({
      donorProfileId,
      reportType: ReportType.ByCategory,
      periodStart: new Date(
        Date.UTC(
          fixture.createdAt.getUTCFullYear(),
          fixture.createdAt.getUTCMonth(),
          1,
        ),
      ),
      periodEnd: new Date(
        Date.UTC(
          fixture.createdAt.getUTCFullYear(),
          fixture.createdAt.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      ),
      totalDonatedQuantity: fixture.donatedQuantity,
      totalRevenue: fixture.price * fixture.donatedQuantity,
      generatedAt: new Date(fixture.collectedAt.getTime() + 60 * 60 * 1000),
    });
    await DonorReportItem.create({
      donorReportId: report._id,
      foodCategory: fixture.foodCategory,
      measurementUnit: fixture.measurementUnit,
      donatedQuantity: fixture.donatedQuantity,
      revenue: fixture.price * fixture.donatedQuantity,
      donationCount: 1,
    });
    assert(donations.has(fixture.key));
  }
}

async function seedSupportingAdminData(admin, recipientProfiles) {
  console.log("9/11 Seeding supporting admin data...");
  const targetUser = recipientProfiles.get("minhAnh").user;
  await RevokedToken.create({
    jti: "aff-seed-revoked-token-2026",
    userId: targetUser._id,
    expiresAt: new Date("2026-12-31T23:59:59.999Z"),
  });
  await AuditLog.create({
    adminId: admin._id,
    action: AdminActionType.ReactivateUser,
    targetType: AuditTargetType.User,
    targetId: targetUser._id,
    previousState: { accountStatus: AccountStatus.Deactivated },
    status: AuditLogStatus.Finalized,
    undoDeadline: new Date("2026-08-15T03:10:00.000Z"),
    undoneBy: null,
    undoneAt: null,
    createdAt: new Date("2026-08-15T03:00:00.000Z"),
  });
}

async function verifySeededData() {
  console.log("10/11 Verifying seeded counts and relationships...");
  const counts = await Promise.all([
    User.countDocuments({}),
    RecipientProfile.countDocuments({}),
    DonorProfile.countDocuments({}),
    Donation.countDocuments({}),
    Reservation.countDocuments({}),
    Notification.countDocuments({}),
    Wallet.countDocuments({}),
    Transaction.countDocuments({}),
    DonorReport.countDocuments({}),
    DonorReportItem.countDocuments({}),
  ]);
  assert.deepEqual(counts, [13, 6, 6, 6, 6, 6, 6, 2, 6, 6]);

  const donations = await Donation.find({}).lean();
  const reservations = await Reservation.find({}).lean();
  const reservationsByDonation = new Map(
    reservations.map((reservation) => [reservation.donationId, reservation]),
  );
  for (const donation of donations) {
    const reservation = reservationsByDonation.get(donation._id);
    assert(reservation, `Missing reservation for ${donation.name}`);
    assert.equal(
      donation.donationLimit - donation.remainingQuantity,
      reservation.quantity,
    );
    assert.equal(donation.revenue, reservation.totalPaid);
    assert.equal(donation.price * reservation.quantity, reservation.totalPaid);
    assert(donation.imageUrl.startsWith("https://"));
  }

  const sortedDates = donations
    .map(({ createdAt }) => createdAt)
    .sort((left, right) => left - right);
  assert.equal(sortedDates[0].getUTCMonth(), 0);
  assert.equal(sortedDates.at(-1).getUTCMonth(), 11);
  console.log("Seeded counts and relationships are consistent.");
}

function logCredentials() {
  console.log("11/11 Development account credentials:");
  console.log(`Shared password: ${DEMO_PASSWORD}`);
  console.log("Admin: admin@aff.com");
  console.log(
    `Recipients: ${recipientFixtures.map(({ email }) => email).join(", ")}`,
  );
  console.log(`Donors: ${donorFixtures.map(({ email }) => email).join(", ")}`);
}

async function seed() {
  try {
    validateFixtures();
    if (env.isProduction) {
      throw new Error("Refusing to reset and seed a production database.");
    }

    const uploadedImages = await uploadSeedImages();
    await connectDatabase();
    console.log(`Target database: ${mongoose.connection.db.databaseName}`);
    await clearDatabase();

    const passwordHash = await bcrypt.hash(
      DEMO_PASSWORD,
      env.auth.bcryptRounds,
    );
    const { admin, recipientUsers, donorUsers } = await seedUsers(passwordHash);
    const { recipientProfiles, donorProfiles } = await seedProfiles(
      recipientUsers,
      donorUsers,
      uploadedImages.donorAvatarUrls,
    );
    await seedRecipientFeatures(recipientProfiles);
    const donations = await seedDonations(
      donorProfiles,
      uploadedImages.donationImageUrls,
    );
    const reservations = await seedReservations(donations, recipientProfiles);
    await seedTransactions(reservations, recipientProfiles);
    await seedNotifications(donations, recipientProfiles);
    await seedDonorReports(donations, donorProfiles);
    await seedSupportingAdminData(admin, recipientProfiles);
    await verifySeededData();
    logCredentials();

    console.log("================================");
    console.log("DATABASE SEED COMPLETED");
    console.log("================================");
  } catch (error) {
    console.error("Database seed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }
  }
}

void seed();
