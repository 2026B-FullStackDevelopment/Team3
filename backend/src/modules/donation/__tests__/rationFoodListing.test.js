import assert from "node:assert/strict";
import test from "node:test";

import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../models/donation.js";
import { updateDonationRation } from "../services/donorListing.js";
import { Reservation } from "../../reservation/models/Reservation.js";
import { validateReservationRequest } from "../../reservation/services/reservation.js";

function mockListingLookup(t, listing) {
  const originalFindOne = Donation.findOne;
  const originalFindById = Donation.findById;
  Donation.findOne = () => Promise.resolve(listing);
  Donation.findById = () => Promise.resolve(listing);
  t.after(() => {
    Donation.findOne = originalFindOne;
    Donation.findById = originalFindById;
  });
}

test("updates ration for an owned open listing", async (t) => {
  const listing = {
    id: "donation-1",
    status: DonationStatus.Active,
    closedAt: null,
    donationLimit: 10,
    remainingQuantity: 8,
    ration: 0,
  };
  mockListingLookup(t, listing);
  const originalFindOneAndUpdate = Donation.findOneAndUpdate;
  let persistenceCall;
  Donation.findOneAndUpdate = (query, update, options) => {
    persistenceCall = { query, update, options };
    return Promise.resolve({ ...listing, ...update.$set });
  };
  t.after(() => {
    Donation.findOneAndUpdate = originalFindOneAndUpdate;
  });

  const result = await updateDonationRation("donation-1", "donor-1", 3);

  assert.equal(result.ration, 3);
  assert.deepEqual(persistenceCall, {
    query: { _id: "donation-1", donorProfileId: "donor-1" },
    update: { $set: { ration: 3 } },
    options: { new: true, runValidators: true },
  });
});

test("rejects a ration greater than available stock", async (t) => {
  mockListingLookup(t, {
    status: DonationStatus.Active,
    closedAt: null,
    donationLimit: 10,
    remainingQuantity: 4,
  });

  await assert.rejects(
    updateDonationRation("donation-1", "donor-1", 5),
    /ration cannot exceed remainingQuantity/,
  );
});

test("reservation validation enforces the listing ration", async (t) => {
  mockListingLookup(t, {
    status: DonationStatus.Active,
    closedAt: null,
    measurementUnit: MeasurementUnit.KG,
    remainingQuantity: 10,
    ration: 2,
  });

  await assert.rejects(
    validateReservationRequest("recipient-1", "donation-1", 3),
    /Requested quantity exceeds ration limit/,
  );
});

test("reservation validation rejects duplicate active reservations", async (t) => {
  mockListingLookup(t, {
    status: DonationStatus.Active,
    closedAt: null,
    measurementUnit: MeasurementUnit.KG,
    remainingQuantity: 10,
    ration: 2,
  });
  const originalFindOne = Reservation.findOne;
  Reservation.findOne = () => Promise.resolve({ _id: "reservation-1" });
  t.after(() => {
    Reservation.findOne = originalFindOne;
  });

  await assert.rejects(
    validateReservationRequest("recipient-1", "donation-1", 2),
    /already has an active reservation/,
  );
});
