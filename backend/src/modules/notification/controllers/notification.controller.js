import * as notificationService from "../services/notification.service.js";

export async function listNotifications(req, res) {
  const result = await notificationService.listNotifications(
    req.user.userId,
    req.query,
  );
  res.status(200).json(result);
}

export async function getUnreadCount(req, res) {
  const result = await notificationService.getUnreadCount(req.user.userId);
  res.status(200).json(result);
}

export async function markRead(req, res) {
  const notification = await notificationService.markRead(
    req.params.notificationId,
    req.user.userId,
  );
  res.status(200).json({ notification });
}

export async function markAllRead(req, res) {
  const result = await notificationService.markAllRead(req.user.userId);
  res.status(200).json(result);
}
