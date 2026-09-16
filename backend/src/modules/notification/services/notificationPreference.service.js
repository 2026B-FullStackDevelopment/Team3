import * as repo from "../repositories/notificationPreference.repository.js";
import {
  toNotificationPreferenceDTO,
  toNotificationPreferenceDTOList,
} from "../dtos/notificationPreference.dto.js";
import { isSamePreference } from "../helpers/notificationPreference.helper.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/errors.js";

/** The recipient's own preferences, DTO-shaped. */
export async function listForRecipient(recipientProfileId) {
  const prefs = await repo.findByRecipientProfileId(recipientProfileId);
  return toNotificationPreferenceDTOList(prefs);
}

/** Minimal preference criteria exposed to another module through the interface. */
export async function getMatchingCriteria(recipientProfileId) {
  const preferences = await repo.findByRecipientProfileId(recipientProfileId);
  return preferences.map((preference) => ({
    foodCategory: [...preference.foodCategory],
    isVegetarian: preference.isVegetarian,
    priceRangeMin: preference.priceRangeMin,
    priceRangeMax: preference.priceRangeMax,
    city: preference.city,
  }));
}

export function findMatchingRecipientProfileIds(listing) {
  return repo.findMatchingRecipientProfileIds(listing);
}

/** Creates a preference for the recipient; 409 if an identical one exists. */
export async function createForRecipient(recipientProfileId, data) {
  const existing = await repo.findByRecipientProfileId(recipientProfileId);
  if (existing.some((p) => isSamePreference(p, data))) {
    throw new ConflictError(
      "You already have a notification preference with these exact settings",
    );
  }
  const pref = await repo.create({ ...data, recipientProfileId });
  return toNotificationPreferenceDTO(pref);
}

/**
 * Updates the recipient's own preference; 404 if not found/owned, 409 if the
 * merged result would duplicate another of the recipient's preferences.
 */
export async function updateForRecipient(prefId, recipientProfileId, patch) {
  const all = await repo.findByRecipientProfileId(recipientProfileId);
  const target = all.find((p) => String(p._id) === prefId);
  if (!target) {
    throw new NotFoundError("Notification preference not found");
  }

  // The full preference after applying the patch (a present `false` is kept).
  const merged = {
    foodCategory: patch.foodCategory ?? target.foodCategory,
    isVegetarian: patch.isVegetarian ?? target.isVegetarian,
    priceRangeMin: patch.priceRangeMin ?? target.priceRangeMin,
    priceRangeMax: patch.priceRangeMax ?? target.priceRangeMax,
    city: patch.city ?? target.city,
  };
  const clashes = all.some(
    (p) => String(p._id) !== prefId && isSamePreference(p, merged),
  );
  if (clashes) {
    throw new ConflictError(
      "Another notification preference already has these exact settings",
    );
  }

  const pref = await repo.updateByIdAndRecipient(
    prefId,
    recipientProfileId,
    patch,
  );
  if (!pref) {
    throw new NotFoundError("Notification preference not found");
  }
  return toNotificationPreferenceDTO(pref);
}

/** Deletes the recipient's own preference; 404 if not found/owned. */
export async function removeForRecipient(prefId, recipientProfileId) {
  const pref = await repo.deleteByIdAndRecipient(prefId, recipientProfileId);
  if (!pref) {
    throw new NotFoundError("Notification preference not found");
  }
}
