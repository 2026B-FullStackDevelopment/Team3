import * as service from "../services/notificationPreference.service.js";
import {
  validateCreatePreference,
  validateUpdatePreference,
} from "../validators/notificationPreference.validators.js";

/** GET /api/notification-preferences */
export async function listPreferences(req, res, next) {
  try {
    const preferences = await service.listForRecipient(
      req.recipientContext.recipientProfileId,
    );
    res.status(200).json({ preferences });
  } catch (error) {
    next(error);
  }
}

/** POST /api/notification-preferences */
export async function createPreference(req, res, next) {
  try {
    const data = validateCreatePreference(req.body);
    const preference = await service.createForRecipient(
      req.recipientContext.recipientProfileId,
      data,
    );
    res.status(201).json({ preference });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/notification-preferences/:id */
export async function updatePreference(req, res, next) {
  try {
    const patch = validateUpdatePreference(req.body);
    const preference = await service.updateForRecipient(
      req.params.id,
      req.recipientContext.recipientProfileId,
      patch,
    );
    res.status(200).json({ preference });
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/notification-preferences/:id */
export async function deletePreference(req, res, next) {
  try {
    await service.removeForRecipient(
      req.params.id,
      req.recipientContext.recipientProfileId,
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
