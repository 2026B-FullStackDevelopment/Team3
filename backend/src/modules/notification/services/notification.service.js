import * as identity from "../../identity/index.js";
import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/errors.js";
import { NotificationType } from "../models/Notification.js";
import * as notificationRepository from "../repositories/notification.repository.js";

function requireText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

export function toNotificationDTO(notification) {
  return {
    id: String(notification._id ?? notification.id),
    userId: String(notification.userId),
    type: notification.type,
    relatedDonationId: String(notification.relatedDonationId),
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
  };
}

async function persistNotification(input, options = {}) {
  const result = await notificationRepository.createNotification(
    {
      userId: requireText(input.userId, "userId"),
      type: input.type,
      relatedDonationId: requireText(
        input.relatedDonationId,
        "relatedDonationId",
      ),
      ...(input.dedupeKey && {
        dedupeKey: requireText(input.dedupeKey, "dedupeKey"),
      }),
    },
    options,
  );
  return {
    notification: toNotificationDTO(result.notification),
    created: result.created,
  };
}

export async function notifyListingSoldOut(event, options = {}) {
  const donorProfile = await identity.loadDonorProfileById(
    requireText(event.donorProfileId, "donorProfileId"),
    options,
  );
  if (!donorProfile) throw new NotFoundError("Donor profile not found");

  const donationId = requireText(event.donationId, "donationId");
  const userId = String(donorProfile.userId);

  return persistNotification(
    {
      userId,
      type: NotificationType.ListingSoldOut,
      relatedDonationId: donationId,
      dedupeKey: `${NotificationType.ListingSoldOut}:${donationId}:${userId}`,
    },
    options,
  );
}

/**
 * Persists notifications for Recipient users already matched by the separately
 * owned Notification Preference module. Matching and preference persistence do
 * not belong to this bounded context.
 */
export async function notifyListingMatched(event, options = {}) {
  const donationId = requireText(event.donationId, "donationId");
  if (
    event.recipientUserIds !== undefined &&
    !Array.isArray(event.recipientUserIds)
  ) {
    throw new ValidationError("recipientUserIds must be an array");
  }
  const recipientUserIds = [
    ...new Set(
      (event.recipientUserIds ?? []).map((userId) =>
        requireText(String(userId ?? ""), "recipientUserId"),
      ),
    ),
  ];

  const results = [];
  for (const userId of recipientUserIds) {
    results.push(
      await persistNotification(
        {
          userId,
          type: NotificationType.ListingMatched,
          relatedDonationId: donationId,
          dedupeKey: `${NotificationType.ListingMatched}:${donationId}:${userId}`,
        },
        options,
      ),
    );
  }
  return results;
}

export async function notifyListingCancelledByAdmin(event, options = {}) {
  const profileIds = [
    ...new Set((event.recipientProfileIds ?? []).map(String)),
  ];
  if (profileIds.length === 0) return [];

  const profiles = await identity.loadRecipientProfilesByIds(
    profileIds,
    options,
  );
  const donationId = requireText(event.donationId, "donationId");

  const userIds = [
    ...new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    ).keys(),
  ];
  const results = [];
  for (const userId of userIds) {
    results.push(
      await persistNotification(
        {
          userId,
          type: NotificationType.ListingCancelledByAdmin,
          relatedDonationId: donationId,
          dedupeKey: `${NotificationType.ListingCancelledByAdmin}:${donationId}:${userId}`,
        },
        options,
      ),
    );
  }
  return results;
}

export async function listNotifications(userId, filters = {}) {
  const unreadOnly =
    filters.unreadOnly === true || filters.unreadOnly === "true";
  const result = await notificationRepository.findByUserId(userId, {
    page: filters.page,
    limit: filters.limit,
    unreadOnly,
  });
  return { ...result, entries: result.entries.map(toNotificationDTO) };
}

export async function getUnreadCount(userId) {
  return { count: await notificationRepository.countUnreadByUserId(userId) };
}

export async function markRead(notificationId, userId) {
  const notification = await notificationRepository.markReadByUserId(
    notificationId,
    userId,
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return toNotificationDTO(notification);
}

export async function markAllRead(userId) {
  const result = await notificationRepository.markAllReadByUserId(userId);
  return { updatedCount: result.modifiedCount ?? 0 };
}
