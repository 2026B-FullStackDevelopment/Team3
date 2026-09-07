import * as subscriptionService from "../services/subscription.service.js";

/**
 * POST /api/profile/subscribe  (protected — requireAuth + requireRole Recipient)
 * Charges the recipient's wallet and grants/extends premium. Returns the
 * updated profile DTO (with the live `isPremium` and new `premiumExpiryDate`).
 */
export async function subscribe(req, res, next) {
  try {
    const profile = await subscriptionService.subscribePremium(req.user.userId);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
