import assert from "node:assert/strict";
import test from "node:test";

import { Donation } from "../models/donation.js";
import {
  listFoodListingDonations,
  toListingDonationResponse,
} from "../services/donorListing.js";
import { Reservation } from "../../reservation/models/Reservation.js";

test("maps reservation records without exposing recipient profile details", () => {
  assert.deepEqual(
    toListingDonationResponse({
      _id: "reservation-1",
      recipientProfileId: {
        _id: "recipient-1",
        userName: "recipient_name",
        city: "private city",
      },
      manualRecipientName: "Walk-in name",
      reservedAt: new Date("2026-08-20T10:00:00.000Z"),
      collectedAt: null,
      quantity: 2,
      status: "Reserved",
      totalPaid: 20,
      paymentMethod: "Cash",
      feedback: "Thank you",
    }),
    {
      id: "reservation-1",
      recipientUsername: "recipient_name",
      reservedAt: new Date("2026-08-20T10:00:00.000Z"),
      collectedAt: null,
      quantity: 2,
      status: "Reserved",
      totalPaid: 20,
      paymentMethod: "Cash",
      feedback: "Thank you",
    },
  );
});

test("uses the walk-in name when no recipient profile is available", () => {
  const result = toListingDonationResponse({
    _id: "reservation-1",
    recipientProfileId: null,
    manualRecipientName: "Walk-in recipient",
    quantity: 1,
    status: "Collected",
    totalPaid: 0,
  });

  assert.equal(result.recipientUsername, "Walk-in recipient");
});

test("lists paginated reservations after checking listing ownership", async (t) => {
  const originalDonationFindOne = Donation.findOne;
  const originalReservationFind = Reservation.find;
  const originalCountDocuments = Reservation.countDocuments;
  const calls = {};

  Donation.findOne = (query) => {
    calls.ownershipQuery = query;
    return Promise.resolve({ id: "donation-1" });
  };
  Reservation.find = (query) => {
    calls.reservationQuery = query;
    return {
      sort(sort) {
        calls.sort = sort;
        return this;
      },
      skip(skip) {
        calls.skip = skip;
        return this;
      },
      limit(limit) {
        calls.limit = limit;
        return this;
      },
      populate(path, select) {
        calls.populate = { path, select };
        return Promise.resolve([
          {
            _id: "reservation-1",
            recipientProfileId: { userName: "recipient_name" },
            quantity: 2,
            status: "Reserved",
            totalPaid: 20,
          },
        ]);
      },
    };
  };
  Reservation.countDocuments = (query) => {
    calls.countQuery = query;
    return Promise.resolve(6);
  };

  t.after(() => {
    Donation.findOne = originalDonationFindOne;
    Reservation.find = originalReservationFind;
    Reservation.countDocuments = originalCountDocuments;
  });

  const result = await listFoodListingDonations("donation-1", "donor-1", {
    page: "2",
    limit: "5",
  });

  assert.deepEqual(calls.ownershipQuery, {
    _id: "donation-1",
    donorProfileId: "donor-1",
  });
  assert.deepEqual(calls.reservationQuery, { donationId: "donation-1" });
  assert.deepEqual(calls.countQuery, calls.reservationQuery);
  assert.deepEqual(calls.sort, { reservedAt: -1, collectedAt: -1 });
  assert.equal(calls.skip, 5);
  assert.equal(calls.limit, 5);
  assert.deepEqual(calls.populate, {
    path: "recipientProfileId",
    select: "userName",
  });
  assert.equal(result.total, 6);
  assert.equal(result.page, 2);
  assert.equal(result.entries[0].recipientUsername, "recipient_name");
});

test("rejects invalid pagination before querying reservations", async (t) => {
  const originalDonationFindOne = Donation.findOne;
  Donation.findOne = () => Promise.resolve({ id: "donation-1" });
  t.after(() => {
    Donation.findOne = originalDonationFindOne;
  });

  await assert.rejects(
    listFoodListingDonations("donation-1", "donor-1", { page: "0" }),
    /page must be a positive integer/,
  );
});
