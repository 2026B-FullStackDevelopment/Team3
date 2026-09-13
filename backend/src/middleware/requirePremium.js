import * as identity from "../modules/identity/index.js";
import { ForbiddenError } from "../shared/errors/errors.js";

/**
 * Premium-recipient gate — mount AFTER requireAuth + requireRole(Recipient).
 * Resolves the caller's recipient context via the Identity facade, rejects
 * non-recipients / non-premium (403), and attaches
 * req.recipientContext = { recipientProfileId, isPremium } for downstream
 * handlers. (SRS 5.3.1)
 */
export async function requirePremium(req, _res, next) {
  try {
    const ctx = await identity.getRecipientContext(req.user.userId);
    if (!ctx) {
      return next(new ForbiddenError("Recipient profile required"));
    }
    if (!ctx.isPremium) {
      return next(
        new ForbiddenError(
          "Premium subscription required to manage notification preferences",
        ),
      );
    }
    req.recipientContext = ctx;
    next();
  } catch (error) {
    next(error);
  }
}
