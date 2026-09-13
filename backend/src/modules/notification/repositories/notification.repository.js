import { Notification } from "../models/Notification.js";

export async function createNotification(data, options = {}) {
  if (data.dedupeKey) {
    return Notification.findOneAndUpdate(
      { dedupeKey: data.dedupeKey },
      { $setOnInsert: data },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        session: options.session,
      },
    );
  }

  const [notification] = await Notification.create([data], {
    session: options.session,
  });
  return notification;
}

export async function findByUserId(userId, filters = {}) {
  const page =
    Number.isInteger(Number(filters.page)) && Number(filters.page) > 0
      ? Number(filters.page)
      : 1;
  const requestedLimit = Number(filters.limit);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;
  const query = { userId };

  if (filters.unreadOnly === true) query.isRead = false;

  const [entries, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  return { entries, total, page, limit };
}

export function countUnreadByUserId(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

export function markReadByUserId(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true, runValidators: true },
  );
}

export function markAllReadByUserId(userId) {
  return Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } },
  );
}
