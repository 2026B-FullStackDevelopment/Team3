import assert from "node:assert/strict";
import test from "node:test";

import {
  allowsOnlineReservationForMeasurementUnit,
  MeasurementUnit,
  PerRequestDonationWarning,
} from "../models/donation.js";
import { Donation } from "../models/donation.js";
import * as donationRepository from "../repositories/donorListingRepository.js";
import {
  buildReservationPolicy,
  listDonorDonations,
  toDonationListingResponse,
} from "../services/donorListing.js";

test("PerRequest measurement unit disables online reservation policy", () => {
  assert.equal(
    allowsOnlineReservationForMeasurementUnit(MeasurementUnit.KG),
    true,
  );
  assert.equal(
    allowsOnlineReservationForMeasurementUnit(MeasurementUnit.PerRequest),
    false,
  );

  assert.deepEqual(buildReservationPolicy(MeasurementUnit.PerRequest), {
    allowsOnlineReservation: false,
    warningMessages: PerRequestDonationWarning,
  });
});

test("donation listing response exposes warning messages for PerRequest", () => {
  const response = toDonationListingResponse({
    toObject() {
      return {
        _id: "donation-1",
        name: "Soup kitchen pickup",
        measurementUnit: MeasurementUnit.PerRequest,
      };
    },
  });

  assert.equal(response.reservationPolicy.allowsOnlineReservation, false);
  assert.deepEqual(
    response.reservationPolicy.warningMessages,
    PerRequestDonationWarning,
  );
});

test("reservation quantity update cannot match PerRequest listings", async (t) => {
  const originalFindOneAndUpdate = Donation.findOneAndUpdate;
  const calls = [];

  Donation.findOneAndUpdate = (...args) => {
    calls.push(args);
    return Promise.resolve(null);
  };

  t.after(() => {
    Donation.findOneAndUpdate = originalFindOneAndUpdate;
  });

  await donationRepository.applyReservation("donation-1", 2, 10000);
  await donationRepository.decrementRemainingQuantity("donation-1", 2);

  assert.equal(calls.length, 2);

  for (const [query] of calls) {
    assert.deepEqual(query.measurementUnit, {
      $ne: MeasurementUnit.PerRequest,
    });
  }
});

test("donor listing search filters, sorts, and paginates by allowed fields", async (t) => {
  const originalFind = Donation.find;
  const originalCountDocuments = Donation.countDocuments;
  const calls = {};

  Donation.find = (query) => {
    calls.findQuery = query;
    return {
      sort(sort) {
        calls.sort = sort;
        return {
          skip(skip) {
            calls.skip = skip;
            return {
              limit(limit) {
                calls.limit = limit;
                return Promise.resolve([{ _id: "donation-1" }]);
              },
            };
          },
        };
      },
    };
  };
  Donation.countDocuments = (query) => {
    calls.countQuery = query;
    return Promise.resolve(12);
  };

  t.after(() => {
    Donation.find = originalFind;
    Donation.countDocuments = originalCountDocuments;
  });

  const result = await listDonorDonations("donor-1", {
    search: "rice.*",
    foodCategory: "CookedDish",
    createdFrom: "2026-08-01",
    createdTo: "2026-08-25",
    sortBy: "revenue",
    sortOrder: "asc",
    page: "2",
    limit: "5",
  });

  assert.equal(calls.findQuery.donorProfileId, "donor-1");
  assert.equal(calls.findQuery.foodCategory, "CookedDish");
  assert.equal(calls.findQuery.name.test("rice.* lunch"), true);
  assert.equal(calls.findQuery.name.test("ricezz lunch"), false);
  assert.equal(calls.findQuery.createdAt.$gte.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(calls.findQuery.createdAt.$lte.toISOString(), "2026-08-25T23:59:59.999Z");
  assert.deepEqual(calls.countQuery, calls.findQuery);
  assert.deepEqual(calls.sort, { revenue: 1 });
  assert.equal(calls.skip, 5);
  assert.equal(calls.limit, 5);
  assert.deepEqual(result.entries, [{ _id: "donation-1" }]);
  assert.equal(result.total, 12);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 5);
  assert.equal(result.sortBy, "revenue");
  assert.equal(result.sortOrder, "asc");
});
