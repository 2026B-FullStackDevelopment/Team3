import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../../models/donation.model.js";
import * as donorListingRepository from "../donorListing.repository.js";

const originalFindOneAndUpdate = Donation.findOneAndUpdate;
const originalFind = Donation.find;
const originalCountDocuments = Donation.countDocuments;

afterEach(() => {
  Donation.findOneAndUpdate = originalFindOneAndUpdate;
  Donation.find = originalFind;
  Donation.countDocuments = originalCountDocuments;
});

function stubFind(entries) {
  let capturedQuery;
  Donation.find = (query) => {
    capturedQuery = query;
    return {
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit() {
        return Promise.resolve(entries);
      },
    };
  };
  Donation.countDocuments = () => Promise.resolve(entries.length);
  return () => capturedQuery;
}

test("findAll ORs search against searchDonorProfileIds when both are given (Admin combined search)", async () => {
  const getQuery = stubFind([]);

  await donorListingRepository.findAll({
    search: "rice",
    searchDonorProfileIds: ["donor-1", "donor-2"],
  });

  assert.deepEqual(getQuery().$or, [
    { name: /rice/i },
    { donorProfileId: { $in: ["donor-1", "donor-2"] } },
  ]);
  assert.equal(getQuery().name, undefined);
});

test("findAll still matches by name alone when searchDonorProfileIds isn't given", async () => {
  const getQuery = stubFind([]);

  await donorListingRepository.findAll({ search: "rice" });

  assert.deepEqual(getQuery().name, /rice/i);
  assert.equal(getQuery().$or, undefined);
});

test("findAll's $or still applies when searchDonorProfileIds resolved to zero donors", async () => {
  const getQuery = stubFind([]);

  await donorListingRepository.findAll({ search: "rice", searchDonorProfileIds: [] });

  assert.deepEqual(getQuery().$or, [{ name: /rice/i }, { donorProfileId: { $in: [] } }]);
});

test("applyReservation decrements and closes sold-out listings in one atomic update", async () => {
  const session = {};
  const updatedListing = { _id: "donation-1", status: DonationStatus.SoldOut };
  let receivedArgs;

  Donation.findOneAndUpdate = (...args) => {
    receivedArgs = args;
    return Promise.resolve(updatedListing);
  };

  const result = await donorListingRepository.applyReservation(
    "donation-1",
    3,
    15,
    { session },
  );

  assert.equal(result, updatedListing);

  const [filter, update, options] = receivedArgs;
  assert.deepEqual(filter, {
    _id: "donation-1",
    status: DonationStatus.Active,
    measurementUnit: { $ne: MeasurementUnit.PerRequest },
    remainingQuantity: { $gte: 3 },
    closedAt: null,
  });
  assert.deepEqual(update[0], {
    $set: {
      remainingQuantity: { $subtract: ["$remainingQuantity", 3] },
      revenue: { $add: [{ $ifNull: ["$revenue", 0] }, 15] },
    },
  });
  assert.deepEqual(update[1].$set.status, {
    $cond: [
      { $lte: ["$remainingQuantity", 0] },
      DonationStatus.SoldOut,
      "$status",
    ],
  });
  assert.deepEqual(update[1].$set.closedAt.$cond.slice(0, 1), [
    { $lte: ["$remainingQuantity", 0] },
  ]);
  assert.ok(update[1].$set.closedAt.$cond[1] instanceof Date);
  assert.equal(update[1].$set.closedAt.$cond[2], "$closedAt");
  assert.deepEqual(options, { new: true, session });
});
