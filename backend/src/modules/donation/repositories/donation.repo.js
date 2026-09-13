import {
  Donation,
  DonationStatus,
  MeasurementUnit,
} from "../models/donation.model.js";

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
    donorProfileIds,
    donationId,
    status,
    statuses,
    foodCategory,
    measurementUnit,
    isVegetarian,
    minPrice,
    maxPrice,
    minRemainingQuantity,
    search,
    searchDonorProfileIds,
    createdFrom,
    createdTo,
    includeClosed = true,
  } = filters;

  const query = {};

  if (donationId !== undefined) query._id = donationId;
  // donorProfileIds (plural) comes from an Admin donor-name search resolved
  // in another module (SRS 7.3.2). If an explicit donorProfileId is ALSO
  // given, AND them together (only keep it if it's actually one of the name
  // matches) instead of either one silently overriding the other -- an
  // empty $in correctly matches zero documents rather than "no filter."
  if (Array.isArray(donorProfileIds) && donorProfileIds.length > 0) {
    const ids =
      donorProfileId !== undefined
        ? donorProfileIds.filter((id) => id === donorProfileId)
        : donorProfileIds;
    query.donorProfileId = { $in: ids };
  } else if (donorProfileId !== undefined) {
    query.donorProfileId = donorProfileId;
  }
  if (status !== undefined) query.status = status;
  if (Array.isArray(statuses) && statuses.length > 0) {
    query.status = { $in: statuses };
  }
  // No explicit status filter given -- default to hiding a listing an admin
  // has put in cancellation limbo, same as it's already hidden from the
  // admin/recipient views (both force an explicit status: Active upstream).
  // An explicit ?status=PendingCancellation filter still overrides this.
  if (query.status === undefined) {
    query.status = { $ne: DonationStatus.PendingCancellation };
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
    // searchDonorProfileIds (distinct from donorProfileIds above) signals
    // that these ids were resolved from the SAME search term as the name
    // match -- the Admin module's combined "grocery name or account name"
    // box (SRS 7.3.2). OR them instead of this function's usual AND
    // composition, so a listing matches on either field. An empty array is
    // still correct here: zero donor-name matches just falls back to
    // name-only matching, unlike donorProfileIds above, which is only set
    // when there ARE ids to filter by.
    if (Array.isArray(searchDonorProfileIds)) {
      query.$or = [{ name: searchRegex }, { donorProfileId: { $in: searchDonorProfileIds } }];
    } else {
      query.name = searchRegex;
    }
  }

  if (!includeClosed) {
    query.closedAt = null;
  }

  return query;
}

export async function create(data) {
  // imageUrl is part of the complete service-validated payload and is enforced
  // again by the Donation schema before MongoDB persistence.
  return Donation.create(data);
}

export async function findById(id, options = {}) {
  const query = Donation.findById(id);
  if (options.session) query.session(options.session);
  return query;
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

export async function updateById(id, data, options = {}) {
  return Donation.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, session: options.session },
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

export async function updateDonationRation(id, donorProfileId, ration) {
  return Donation.findOneAndUpdate(
    { _id: id, donorProfileId },
    { $set: { ration } },
    { new: true, runValidators: true },
  );
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

export async function decrementRemainingQuantity(id, quantity, options = {}) {
  return Donation.findOneAndUpdate(
    {
      _id: id,
      status: DonationStatus.Active,
      measurementUnit: { $ne: MeasurementUnit.PerRequest },
      remainingQuantity: { $gte: quantity },
      closedAt: null,
    },
    { $inc: { remainingQuantity: -quantity } },
    { new: true, runValidators: true, session: options.session },
  );
}

export async function incrementRemainingQuantity(id, quantity, options = {}) {
  return Donation.findByIdAndUpdate(
    id,
    { $inc: { remainingQuantity: quantity } },
    { new: true, runValidators: true, session: options.session },
  );
}

export async function addRevenue(id, amount, options = {}) {
  return Donation.findByIdAndUpdate(
    id,
    { $inc: { revenue: amount } },
    { new: true, runValidators: true, session: options.session },
  );
}

export async function applyReservation(id, quantity, totalPaid, options = {}) {
  const soldOutAt = new Date();

  return Donation.findOneAndUpdate(
    {
      _id: id,
      status: DonationStatus.Active,
      measurementUnit: { $ne: MeasurementUnit.PerRequest },
      remainingQuantity: { $gte: quantity },
      closedAt: null,
    },
    [
      {
        $set: {
          remainingQuantity: { $subtract: ["$remainingQuantity", quantity] },
          revenue: { $add: [{ $ifNull: ["$revenue", 0] }, totalPaid] },
        },
      },
      {
        $set: {
          status: {
            $cond: [
              { $lte: ["$remainingQuantity", 0] },
              DonationStatus.SoldOut,
              "$status",
            ],
          },
          closedAt: {
            $cond: [
              { $lte: ["$remainingQuantity", 0] },
              soldOutAt,
              "$closedAt",
            ],
          },
        },
      },
    ],
    { new: true, session: options.session },
  );
}

export async function closeIfSoldOut(id, options = {}) {
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
    { new: true, runValidators: true, session: options.session },
  );
}

export async function deleteById(id) {
  return Donation.findByIdAndDelete(id);
}

export async function deleteOwnedDonation(id, donorProfileId) {
  return Donation.findOneAndDelete({ _id: id, donorProfileId });
}
