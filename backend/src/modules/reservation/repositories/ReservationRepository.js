import { Reservation, ReservationStatus } from "../models/Reservation.js";

/** Create new reservation */
export async function createReservation(reservationData, options = {}) {
  const newReservation = new Reservation(reservationData);
  return await newReservation.save({ session: options.session });
}

/** Find a Card reservation already fulfilled from this Stripe session. */
export async function findByStripeSessionId(stripeSessionId) {
  return await Reservation.findOne({ stripeSessionId });
}

/**
 * SRS 5.1.4 collection history — only reservations actually collected, each
 * with the donor's name so the frontend never needs a reservedAt fallback.
 */
export async function getReservationsByRecipient(recipientProfileId) {
  return await Reservation.find({ recipientProfileId })
    .sort({ reservedAt: -1 })
    .populate({
      path: "donationId",
      select: "name foodCategory imageUrl donorProfileId",
      populate: {
        path: "donorProfileId",
        select: "companyName address city location",
      },
    });
}

/** Check if a reservation already exists for this recipient and donation */
export async function checkExistingReservation(recipientProfileId, donationId) {
  return await Reservation.findOne({
    recipientProfileId,
    donationId,
    status: ReservationStatus.Reserved,
  });
}

export async function findByDonationId(donationId, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    Reservation.find({ donationId })
      .skip(skip)
      .limit(limit)
      .populate("recipientProfileId"),
    Reservation.countDocuments({ donationId }),
  ]);
  return { entries, total, page, limit };
}

export function aggregateCollectedByDonationIds(donationIds, options = {}) {
  if (donationIds.length === 0) return Promise.resolve([]);

  const match = {
    donationId: { $in: donationIds },
    status: ReservationStatus.Collected,
  };
  if (options.periodStart !== undefined || options.periodEnd !== undefined) {
    match.collectedAt = {};
    if (options.periodStart !== undefined) {
      match.collectedAt.$gte = options.periodStart;
    }
    if (options.periodEnd !== undefined) {
      match.collectedAt.$lte = options.periodEnd;
    }
  }

  const aggregate = Reservation.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$donationId",
        donatedQuantity: { $sum: "$quantity" },
        donationCount: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalPaid", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        donationId: "$_id",
        donatedQuantity: 1,
        donationCount: 1,
        revenue: 1,
      },
    },
  ]);
  if (options.session) aggregate.session(options.session);
  return aggregate;
}

/**
 * Returns the recipient profiles that currently hold active reservations for
 * a listing. Manual/walk-in reservations have no recipientProfileId and are
 * deliberately excluded from the notification audience.
 */
export async function listAffectedRecipientProfileIds(
  donationId,
  options = {},
) {
  const query = Reservation.distinct("recipientProfileId", {
    donationId,
    status: ReservationStatus.Reserved,
    recipientProfileId: { $ne: null },
  });
  if (options.session) query.session(options.session);
  return query;
}

/**
 * Attach recipient feedback (SRS 5.2.4). Ownership and "already collected"
 * are enforced by the query filter itself so a single findOneAndUpdate
 * covers both checks — a null result just means "not eligible", which the
 * caller reports as one generic error.
 */
export async function submitFeedback(
  reservationId,
  recipientProfileId,
  feedback,
) {
  return await Reservation.findOneAndUpdate(
    {
      _id: reservationId,
      recipientProfileId,
      status: {
        $in: [
          ReservationStatus.Collected,
          ReservationStatus.CollectedByRecipient,
        ],
      },
    },
    { feedback },
    { new: true },
  );
}

export async function cancelActiveReservationsForDonation(
  donationId,
  options = {},
) {
  return await Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByDonor } },
    { session: options.session },
  );
}

/**
 * Same shape as cancelActiveReservationsForDonation, but for an Admin
 * cancelling someone else's listing (SRS 7.2.2) rather than a Donor
 * cancelling their own (SRS 4.2.3) -- kept as its own function rather than
 * a shared one with a status parameter so each caller's intent stays
 * obvious, and because the two land on distinct ReservationStatus values
 * (CancelledByAdmin vs CancelledByDonor) that the rest of the app displays
 * differently.
 */
export async function cancelActiveReservationsByAdmin(
  donationId,
  options = {},
) {
  return await Reservation.updateMany(
    { donationId, status: ReservationStatus.Reserved },
    { $set: { status: ReservationStatus.CancelledByAdmin } },
    { session: options.session },
  );
}
