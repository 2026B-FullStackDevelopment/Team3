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

/**
 * POST /api/profile/subscribe/checkout  (protected — requireAuth + Recipient)
 * Starts a Stripe card payment for premium (SRS 6.2.1). Returns { url } to
 * redirect to; premium is granted by the payment webhook, not this response.
 */
export async function subscribeCheckout(req, res, next) {
  try {
    const result = await subscriptionService.createPremiumCheckout(
      req.user.userId,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
