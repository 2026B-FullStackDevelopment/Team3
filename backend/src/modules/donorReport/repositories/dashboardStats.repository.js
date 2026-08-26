import { Donation } from "../../donation/models/donation.model.js";
import {
  Reservation,
  ReservationStatus,
} from "../../reservation/models/Reservation.js";

function buildCollectedAtFilter(periodStart, periodEnd) {
  if (periodStart === undefined && periodEnd === undefined) return {};

  const collectedAt = {};
  if (periodStart !== undefined) collectedAt.$gte = periodStart;
  if (periodEnd !== undefined) collectedAt.$lte = periodEnd;

  return { collectedAt };
}

function buildCollectedDonationPipeline(donorProfileId, periodStart, periodEnd) {
  return [
    {
      $match: {
        status: ReservationStatus.Collected,
        ...buildCollectedAtFilter(periodStart, periodEnd),
      },
    },
    {
      $lookup: {
        from: Donation.collection.name,
        localField: "donationId",
        foreignField: "_id",
        as: "donation",
      },
    },
    { $unwind: "$donation" },
    { $match: { "donation.donorProfileId": donorProfileId } },
  ];
}

export async function aggregateSummary(filters = {}) {
  const { donorProfileId, periodStart, periodEnd } = filters;
  const [summary] = await Reservation.aggregate([
    ...buildCollectedDonationPipeline(donorProfileId, periodStart, periodEnd),
    {
      $group: {
        _id: null,
        totalDonatedQuantity: { $sum: "$quantity" },
        totalRevenue: { $sum: { $ifNull: ["$totalPaid", 0] } },
        donationCount: { $sum: 1 },
      },
    },
    { $project: { _id: 0 } },
  ]);

  return (
    summary ?? {
      totalDonatedQuantity: 0,
      totalRevenue: 0,
      donationCount: 0,
    }
  );
}

export async function aggregateByCategory(filters = {}) {
  const { donorProfileId, periodStart, periodEnd } = filters;
  return Reservation.aggregate([
    ...buildCollectedDonationPipeline(donorProfileId, periodStart, periodEnd),
    {
      $group: {
        _id: "$donation.foodCategory",
        donatedQuantity: { $sum: "$quantity" },
        donationCount: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalPaid", 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        foodCategory: "$_id",
        donatedQuantity: 1,
        donationCount: 1,
        revenue: 1,
      },
    },
  ]);
}

export async function aggregateByMeasurementUnit(filters = {}) {
  const { donorProfileId, periodStart, periodEnd } = filters;
  return Reservation.aggregate([
    ...buildCollectedDonationPipeline(donorProfileId, periodStart, periodEnd),
    {
      $group: {
        _id: "$donation.measurementUnit",
        donatedQuantity: { $sum: "$quantity" },
        donationCount: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalPaid", 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        measurementUnit: "$_id",
        donatedQuantity: 1,
        donationCount: 1,
        revenue: 1,
      },
    },
  ]);
}
