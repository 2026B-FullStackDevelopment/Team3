import * as notificationService from "../services/notification.service.js";
import { publishNotifications } from "../realtime/notification.gateway.js";

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
