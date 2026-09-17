import * as notificationService from "../services/notification.service.js";
import * as notificationPreferenceService from "../services/notificationPreference.service.js";
import { publishNotifications } from "../realtime/notification.gateway.js";
import * as identity from "../../identity/index.js";

export function notifyListingSoldOut(event, options) {
  return notificationService.notifyListingSoldOut(event, options);
}

export function notifyListingMatched(event, options) {
  return notificationService.notifyListingMatched(event, options);
}

export function notifyListingCancelledByAdmin(event, options) {
  return notificationService.notifyListingCancelledByAdmin(event, options);
}

export function publishCreatedNotifications(notifications) {
  publishNotifications(notifications);
}

/**
 * Public Donation -> Notification operation for SRS 5.3.2. This interface owns
 * every cross-module call; Notification internals remain private.
 */
export async function notifyNewListingMatches(event, options = {}) {
  const donor = await identity.getDonorMatchingLocation(
    event.donorProfileId,
    options,
  );
  if (!donor?.city) return [];

  const recipientProfileIds =
    await notificationPreferenceService.findMatchingRecipientProfileIds(
      {
        foodCategory: event.foodCategory,
        isVegetarian: event.isVegetarian,
        price: event.price,
        city: donor.city,
      },
      options,
    );
  if (recipientProfileIds.length === 0) return [];

  const recipients = await identity.getActivePremiumRecipientRefs(
    recipientProfileIds,
    options,
  );
  const results = await notificationService.notifyListingMatched(
    {
      donationId: event.donationId,
      recipientUserIds: recipients.map((recipient) => recipient.userId),
    },
    options,
  );
  // A caller using a MongoDB transaction must publish only after commit so a
  // Recipient never receives an event for data that is later rolled back.
  if (options.publish !== false) publishNotifications(results);
  return results;
}

/** Public Donation -> Notification preference criteria operation for 5.3.3. */
export function getRecipientMatchingCriteria(recipientProfileId) {
  return notificationPreferenceService.getMatchingCriteria(recipientProfileId);
}
