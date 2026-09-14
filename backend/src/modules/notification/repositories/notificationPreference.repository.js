import { NotificationPreference } from "../models/NotificationPreference.js";

/** Inserts a new preference. */
export async function create(data) {
  return NotificationPreference.create(data);
}

/** All preferences owned by a recipient, newest-first. */
export async function findByRecipientProfileId(recipientProfileId) {
  return NotificationPreference.find({ recipientProfileId }).sort({ createdAt: -1 });
}

/**
 * Updates a preference only if it belongs to the recipient. Returns the updated
 * doc, or null when the id doesn't exist or isn't owned by the caller.
 */
export async function updateByIdAndRecipient(prefId, recipientProfileId, patch) {
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
  return NotificationPreference.findOneAndDelete({ _id: prefId, recipientProfileId });
}
