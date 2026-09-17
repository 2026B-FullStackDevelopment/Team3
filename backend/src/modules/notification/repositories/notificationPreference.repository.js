import { NotificationPreference } from "../models/NotificationPreference.js";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Inserts a new preference. */
export async function create(data) {
  return NotificationPreference.create(data);
}

/** All preferences owned by a recipient, newest-first. */
export async function findByRecipientProfileId(recipientProfileId) {
  return NotificationPreference.find({ recipientProfileId }).sort({
    createdAt: -1,
  });
}

/** Preference owners whose complete preference matches a newly-created listing. */
export async function findMatchingRecipientProfileIds(listing, options = {}) {
  const city = new RegExp(`^${escapeRegExp(listing.city)}$`, "i");
  // A null preference is the explicit "Any" wildcard. When the Donor leaves
  // the listing status unspecified, do not filter on this field: the listing
  // may still match either Vegetarian, Non-vegetarian, or Any preferences.
  const vegetarianFilter =
    listing.isVegetarian === null || listing.isVegetarian === undefined
      ? undefined
      : { $in: [null, listing.isVegetarian] };
  const filters = {
    foodCategory: listing.foodCategory,
    priceRangeMin: { $lte: listing.price },
    priceRangeMax: { $gte: listing.price },
    city,
  };
  if (vegetarianFilter !== undefined) {
    filters.isVegetarian = vegetarianFilter;
  }

  const query =
    NotificationPreference.find(filters).select("recipientProfileId");
  if (options.session) query.session(options.session);
  const preferences = await query;

  return [
    ...new Set(
      preferences.map((preference) => String(preference.recipientProfileId)),
    ),
  ];
}

/**
 * Updates a preference only if it belongs to the recipient. Returns the updated
 * doc, or null when the id doesn't exist or isn't owned by the caller.
 */
export async function updateByIdAndRecipient(
  prefId,
  recipientProfileId,
  patch,
) {
  return NotificationPreference.findOneAndUpdate(
    { _id: prefId, recipientProfileId },
    { $set: patch },
    { returnDocument: "after" },
  );
}

/**
 * Deletes a preference only if it belongs to the recipient. Returns the deleted
 * doc, or null when the id doesn't exist or isn't owned by the caller.
 */
export async function deleteByIdAndRecipient(prefId, recipientProfileId) {
  return NotificationPreference.findOneAndDelete({
    _id: prefId,
    recipientProfileId,
  });
}
