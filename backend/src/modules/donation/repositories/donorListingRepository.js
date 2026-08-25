import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../models/donation.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

function normalizeLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

function buildDonationQuery(filters = {}) {
  const {
    donorProfileId,
    status,
    statuses,
    foodCategory,
    measurementUnit,
    isVegetarian,
    minPrice,
    maxPrice,
    minRemainingQuantity,
    search,
    createdFrom,
    createdTo,
    includeClosed = true,
  } = filters;

  const query = {};

  if (donorProfileId !== undefined) query.donorProfileId = donorProfileId;
  if (status !== undefined) query.status = status;
  if (Array.isArray(statuses) && statuses.length > 0) {
    query.status = { $in: statuses };
  }
  if (foodCategory !== undefined) query.foodCategory = foodCategory;
  if (measurementUnit !== undefined) query.measurementUnit = measurementUnit;
  if (isVegetarian !== undefined) query.isVegetarian = isVegetarian;

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (minRemainingQuantity !== undefined) {
    query.remainingQuantity = { $gte: minRemainingQuantity };
  }

  if (createdFrom !== undefined || createdTo !== undefined) {
    query.createdAt = {};
    if (createdFrom !== undefined) query.createdAt.$gte = createdFrom;
    if (createdTo !== undefined) query.createdAt.$lte = createdTo;
  }

  if (search !== undefined && String(search).trim() !== "") {
    const searchRegex = new RegExp(escapeRegExp(String(search).trim()), "i");
    query.name = searchRegex;
  }

  if (!includeClosed) {
    query.closedAt = null;
  }

  return query;
}

export async function create(data) {
  return Donation.create(data);
}

export async function findById(id) {
  return Donation.findById(id);
}

export async function findDonationById(id) {
  return findById(id);
}

export async function findOwnedDonation(id, donorProfileId) {
  return Donation.findOne({ _id: id, donorProfileId });
}

export async function findDonationsByDonor(donorProfileId, options = {}) {
  const { includeClosed = true, sort = { createdAt: -1 } } = options;

  return findAll({
    ...options,
    donorProfileId,
    includeClosed,
    sort,
  });
}

export async function findActiveDonations(filters = {}) {
  return findAll({
    ...filters,
    status: DonationStatus.Active,
    minRemainingQuantity: filters.minRemainingQuantity ?? 1,
    includeClosed: false,
  });
}

export async function findAll(filters = {}) {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = { createdAt: -1 },
    sortBy,
    sortOrder,
  } = filters;

  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);
  const query = buildDonationQuery(filters);
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [entries, total] = await Promise.all([
    Donation.find(query).sort(sort).skip(skip).limit(normalizedLimit),
    Donation.countDocuments(query),
  ]);

  return {
    entries,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    sortBy,
    sortOrder,
  };
}

export async function updateById(id, data) {
  return Donation.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );
}

export async function updateOwnedDonation(id, donorProfileId, data) {
  return Donation.findOneAndUpdate(
    { _id: id, donorProfileId },
    { $set: data },
    { new: true, runValidators: true },
  );
}

export async function updateDonationStatus(id, donorProfileId, status) {
  const update = { status };

  if (
    status === DonationStatus.Cancelled ||
    status === DonationStatus.SoldOut
  ) {
    update.closedAt = new Date();
  }

  if (status === DonationStatus.Active || status === DonationStatus.Paused) {
    update.closedAt = null;
  }

  return updateOwnedDonation(id, donorProfileId, update);
}

export async function markPendingCancellation(id, donorProfileId) {
  return updateDonationStatus(
    id,
    donorProfileId,
    DonationStatus.PendingCancellation,
  );
}

export async function cancelDonation(id, donorProfileId) {
  return updateDonationStatus(id, donorProfileId, DonationStatus.Cancelled);
}

export async function markSoldOut(id, donorProfileId) {
  return updateDonationStatus(id, donorProfileId, DonationStatus.SoldOut);
}

export async function decrementRemainingQuantity(id, quantity) {
  return Donation.findOneAndUpdate(
    {
      _id: id,
      status: DonationStatus.Active,
      measurementUnit: { $ne: MeasurementUnit.PerRequest },
      remainingQuantity: { $gte: quantity },
      closedAt: null,
    },
    { $inc: { remainingQuantity: -quantity } },
    { new: true, runValidators: true },
  );
}

export async function incrementRemainingQuantity(id, quantity) {
  return Donation.findByIdAndUpdate(
    id,
    { $inc: { remainingQuantity: quantity } },
    { new: true, runValidators: true },
  );
}

export async function addRevenue(id, amount) {
  return Donation.findByIdAndUpdate(
    id,
    { $inc: { revenue: amount } },
    { new: true, runValidators: true },
  );
}

export async function applyReservation(id, quantity, totalPaid) {
  return Donation.findOneAndUpdate(
    {
      _id: id,
      status: DonationStatus.Active,
      measurementUnit: { $ne: MeasurementUnit.PerRequest },
      remainingQuantity: { $gte: quantity },
      closedAt: null,
    },
    {
      $inc: {
        remainingQuantity: -quantity,
        revenue: totalPaid,
      },
    },
    { new: true, runValidators: true },
  );
}

export async function closeIfSoldOut(id) {
  return Donation.findOneAndUpdate(
    {
      _id: id,
      remainingQuantity: { $lte: 0 },
      status: { $ne: DonationStatus.SoldOut },
    },
    {
      $set: {
        status: DonationStatus.SoldOut,
        closedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );
}

export async function deleteById(id) {
  return Donation.findByIdAndDelete(id);
}

export async function deleteOwnedDonation(id, donorProfileId) {
  return Donation.findOneAndDelete({ _id: id, donorProfileId });
}
