export const NOTIFICATION_TYPES = Object.freeze({
  LISTING_MATCHED: "ListingMatched",
  LISTING_SOLD_OUT: "ListingSoldOut",
  LISTING_CANCELLED_BY_ADMIN: "ListingCancelledByAdmin",
});

const CONTENT = Object.freeze({
  [NOTIFICATION_TYPES.LISTING_MATCHED]: {
    title: "A food listing matches your preferences",
    message: "A matching food listing is now available.",
    icon: "match",
  },
  [NOTIFICATION_TYPES.LISTING_SOLD_OUT]: {
    title: "Your listing is fully donated",
    message: "The food listing has moved to Sold Out.",
    icon: "soldOut",
  },
  [NOTIFICATION_TYPES.LISTING_CANCELLED_BY_ADMIN]: {
    title: "A reservation was cancelled",
    message: "The reservation was cancelled by an administrator.",
    icon: "cancelled",
  },
});

const FALLBACK_CONTENT = {
  title: "Notification update",
  message: "There is a new update for your account.",
  icon: "bell",
};

export function normalizeNotification(value) {
  if (!value || typeof value !== "object" || !value.id || !value.type)
    return null;
  const createdAt = new Date(value.createdAt);
  return {
    id: String(value.id),
    userId: value.userId == null ? null : String(value.userId),
    type: String(value.type),
    relatedDonationId:
      value.relatedDonationId == null ? null : String(value.relatedDonationId),
    isRead: Boolean(value.isRead),
    createdAt: Number.isNaN(createdAt.getTime())
      ? new Date().toISOString()
      : createdAt.toISOString(),
  };
}

export function notificationContent(type) {
  return CONTENT[type] ?? FALLBACK_CONTENT;
}

export function formatNotificationTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (hours < 48) return "Yesterday";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year:
      new Date(value).getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  }).format(new Date(value));
}
