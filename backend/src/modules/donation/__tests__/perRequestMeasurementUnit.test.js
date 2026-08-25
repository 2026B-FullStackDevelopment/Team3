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
