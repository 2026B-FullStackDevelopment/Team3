import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.js";
import * as notificationController from "../controllers/notification.controller.js";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get("/", notificationController.listNotifications);
notificationRoutes.get("/unread-count", notificationController.getUnreadCount);
notificationRoutes.patch("/read-all", notificationController.markAllRead);
notificationRoutes.patch(
  "/:notificationId/read",
  notificationController.markRead,
);
