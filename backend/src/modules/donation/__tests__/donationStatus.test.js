import assert from "node:assert/strict";
import test from "node:test";

import { Donation, DonationStatus } from "../models/donation.js";
import { changeDonationStatus } from "../services/donorListing.js";
import {
  Reservation,
  ReservationStatus,
} from "../../reservation/models/Reservation.js";

function mockStatusPersistence(t, donation) {
  const originalFindOne = Donation.findOne;
  const originalFindOneAndUpdate = Donation.findOneAndUpdate;
  const updates = [];

  Donation.findOne = () => Promise.resolve(donation);
  Donation.findOneAndUpdate = (query, update) => {
    updates.push({ query, update });
    return Promise.resolve({ ...donation, ...update.$set });
  };

  t.after(() => {
    Donation.findOne = originalFindOne;
    Donation.findOneAndUpdate = originalFindOneAndUpdate;
  });

  return updates;
}

test("pauses an active listing without changing reservations", async (t) => {
  const updates = mockStatusPersistence(t, {
    id: "donation-1",
    status: DonationStatus.Active,
    remainingQuantity: 5,
  });
  const originalUpdateMany = Reservation.updateMany;
  let reservationUpdateCount = 0;
  Reservation.updateMany = () => {
    reservationUpdateCount += 1;
  };
  t.after(() => {
    Reservation.updateMany = originalUpdateMany;
  });

  const result = await changeDonationStatus(
    "donation-1",
    "donor-1",
    DonationStatus.Paused,
  );

  assert.equal(result.status, DonationStatus.Paused);
  assert.equal(updates[0].update.$set.closedAt, null);
  assert.equal(reservationUpdateCount, 0);
});

test("resumes a paused listing with remaining quantity", async (t) => {
  mockStatusPersistence(t, {
    id: "donation-1",
    status: DonationStatus.Paused,
    remainingQuantity: 5,
  });

  const result = await changeDonationStatus(
    "donation-1",
    "donor-1",
    DonationStatus.Active,
  );

  assert.equal(result.status, DonationStatus.Active);
  assert.equal(result.closedAt, null);
});

test("cancels only active reservations when a listing is cancelled", async (t) => {
  mockStatusPersistence(t, {
    id: "donation-1",
    status: DonationStatus.Active,
    remainingQuantity: 5,
  });
  const originalUpdateMany = Reservation.updateMany;
  let reservationUpdate;
  Reservation.updateMany = (query, update) => {
    reservationUpdate = { query, update };
    return Promise.resolve({ modifiedCount: 2 });
  };
  t.after(() => {
    Reservation.updateMany = originalUpdateMany;
  });

  const result = await changeDonationStatus(
    "donation-1",
    "donor-1",
    DonationStatus.Cancelled,
  );

  assert.equal(result.status, DonationStatus.Cancelled);
  assert.ok(result.closedAt instanceof Date);
  assert.deepEqual(reservationUpdate, {
    query: {
      donationId: "donation-1",
      status: ReservationStatus.Reserved,
    },
    update: { $set: { status: ReservationStatus.CancelledByDonor } },
  });
});

test("rejects donor transitions not present in the lifecycle table", async (t) => {
  mockStatusPersistence(t, {
    id: "donation-1",
    status: DonationStatus.Active,
    remainingQuantity: 5,
  });

  await assert.rejects(
    changeDonationStatus("donation-1", "donor-1", DonationStatus.SoldOut),
    /cannot change from Active to SoldOut/,
  );
});
