import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import "dotenv/config";
import mongoose from "mongoose";

import { DonorReport, ReportType } from "../../models/DonorReport.js";
import { DonorReportItem } from "../../models/DonorReportItem.js";
import { MeasurementUnit } from "../../models/donation.js";
import { foodCategory } from "../../models/NotificationPreference.js";
import * as repository from "../donorReportItemsRepository.js";

const testDatabaseUri = process.env.MONGODB_URI_TEST;

test(
  "donorReportItemsRepository persists and manages report items",
  { skip: !testDatabaseUri && "MONGODB_URI_TEST is not configured" },
  async (t) => {
    const firstReportId = randomUUID();
    const secondReportId = randomUUID();

    await mongoose.connect(testDatabaseUri);

    t.after(async () => {
      await DonorReportItem.deleteMany({
        donorReportId: { $in: [firstReportId, secondReportId] },
      });
      await DonorReport.deleteMany({
        _id: { $in: [firstReportId, secondReportId] },
      });
      await mongoose.disconnect();
    });

    await DonorReport.create([
      {
        _id: firstReportId,
        donorProfileId: randomUUID(),
        reportType: ReportType.ByCategory,
        periodStart: new Date("2026-08-01T00:00:00.000Z"),
        periodEnd: new Date("2026-08-31T23:59:59.999Z"),
        generatedAt: new Date(),
      },
      {
        _id: secondReportId,
        donorProfileId: randomUUID(),
        reportType: ReportType.ByMeasurementUnit,
        periodStart: new Date("2026-08-01T00:00:00.000Z"),
        periodEnd: new Date("2026-08-31T23:59:59.999Z"),
        generatedAt: new Date(),
      },
    ]);

    const created = await repository.create({
      donorReportId: firstReportId,
      foodCategory: foodCategory.Fruit,
      donatedQuantity: 10,
      donationCount: 2,
      revenue: 50000,
    });

    assert.equal(created.donorReportId, firstReportId);
    assert.equal(created.foodCategory, foodCategory.Fruit);

    const foundById = await repository.findById(created._id);
    assert.ok(foundById);
    assert.equal(foundById._id, created._id);

    const missingItem = await repository.findById(randomUUID());
    assert.equal(missingItem, null);

    const createdMany = await repository.createMany([
      {
        donorReportId: firstReportId,
        foodCategory: foodCategory.Vegetable,
        donatedQuantity: 20,
        donationCount: 4,
        revenue: 100000,
      },
      {
        donorReportId: secondReportId,
        measurementUnit: MeasurementUnit.KG,
        donatedQuantity: 30,
        donationCount: 3,
        revenue: 150000,
      },
    ]);

    assert.equal(createdMany.length, 2);
    assert.deepEqual(await repository.createMany([]), []);

    const firstReportItems = await repository.findByReportId(firstReportId);
    assert.equal(firstReportItems.length, 2);
    assert.ok(firstReportItems.every((item) => item.donorReportId === firstReportId));

    const replacements = await repository.replaceForReport(firstReportId, [
      {
        foodCategory: foodCategory.BakedGoods,
        donatedQuantity: 12,
        donationCount: 1,
        revenue: 60000,
      },
    ]);

    assert.equal(replacements.length, 1);
    assert.equal(replacements[0].donorReportId, firstReportId);
    assert.equal(replacements[0].foodCategory, foodCategory.BakedGoods);

    const secondReportItems = await repository.findByReportId(secondReportId);
    assert.equal(secondReportItems.length, 1);

    const deletion = await repository.deleteByReportId(firstReportId);
    assert.equal(deletion.deletedCount, 1);
    assert.deepEqual(await repository.findByReportId(firstReportId), []);

    await repository.replaceForReport(secondReportId, []);
    assert.deepEqual(await repository.findByReportId(secondReportId), []);

    await assert.rejects(
      repository.create({
        donorReportId: firstReportId,
        foodCategory: "InvalidCategory",
        donatedQuantity: 1,
        donationCount: 1,
        revenue: 0,
      }),
      (error) => error?.name === "ValidationError",
    );
  },
);
