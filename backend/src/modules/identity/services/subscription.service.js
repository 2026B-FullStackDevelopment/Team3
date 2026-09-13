import mongoose from "mongoose";
import * as userRepository from "../repositories/user.repository.js";
import * as recipientProfileRepository from "../repositories/recipientProfile.repository.js";
import * as walletFacade from "../../wallet/index.js";
import * as paymentsFacade from "../../payments/index.js";
import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
import { toProfileDTO } from "../dtos/profile.dto.js";
import { isPremiumActive, nextExpiry } from "../helpers/premium.helper.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/errors.js";
import { sendMail } from "../../../shared/mail/mailer.js";
import { premiumConfirmationEmail } from "../../../shared/mail/templates/premiumConfirmation.js";

// Fixed business rule (BUSINESS_RULES §2): premium is a nominal 5 USD/month,
// pinned to a fixed VND price since the wallet is VND-denominated. These are
// stable domain constants, not deployment config, so they live here — not .env.
const PREMIUM_PRICE_VND = 125_000;
const PREMIUM_DURATION_MONTHS = 1;

/**
 * Buys one month of premium for a Recipient (manual, one-off). A recipient who
 * is already an ACTIVE premium may not pay again (409) — no stacking.
 *
 * The premium claim and the wallet charge run in ONE Mongo transaction on a
 * shared session, so they commit together or roll back together:
 *   - the guarded claim (`activatePremiumIfInactive`) flips inactive→active only
 *     if not currently active — the idempotency + race guard (a duplicate or
 *     concurrent call gets `null` → 409, never charged);
 *   - the wallet debit joins the same session — insufficient funds (→ 400) or any
 *     failure aborts the whole transaction, rolling the claim back. There is no
 *     window where a recipient is left premium without a completed charge.
 *
 * Returns the updated profile DTO.
 */
export async function subscribePremium(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }
  // Deactivated accounts are already blocked upstream by the auth middleware
  // (it rejects any non-Active account on every protected request), so no
  // account-status guard is needed here.

  const profile = await recipientProfileRepository.findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  // Fast, friendly reject for the common case; the atomic claim below is the
  // authoritative guard against races/duplicates.
  if (isPremiumActive(profile)) {
    throw new ConflictError("You already have an active premium subscription");
  }

  const now = new Date();
  const newExpiry = nextExpiry(profile, now, PREMIUM_DURATION_MONTHS);

  const session = await mongoose.startSession();
  try {
    let dto;
    await session.withTransaction(async () => {
      // 1. Claim premium atomically — only if not already active.
      const claimed = await recipientProfileRepository.activatePremiumIfInactive(
        userId,
        newExpiry,
        now,
        { session },
      );
      if (!claimed) {
        // Lost the race (someone else just activated) — abort without charging.
        throw new ConflictError("You already have an active premium subscription");
      }

      // 2. Charge on the SAME session. Insufficient funds → 400 aborts the txn,
      // rolling back the claim; nothing is left half-done.
      await walletFacade.debit(
        userId,
        PREMIUM_PRICE_VND,
        {
          type: walletFacade.TransactionType.SubscriptionPayment,
          method: PaymentMethod.Wallet,
        },
        { session },
      );

      dto = toProfileDTO(user, claimed);
    });
    // Payment is committed. Notify the recipient (SRS 6.1.2) as a post-commit
    // side effect: fire-and-forget so email latency never delays the response
    // and a mail failure can never fail or roll back the charge. sendMail
    // already swallows its own errors; the .catch is belt-and-suspenders.
    sendMail({
      to: user.email,
      ...premiumConfirmationEmail({
        premiumExpiryDate: newExpiry,
        amountVnd: PREMIUM_PRICE_VND,
      }),
    }).catch((error) => {
      console.error("[mail] premium confirmation failed", error);
    });

    return dto;
  } finally {
    await session.endSession();
  }
}

/**
 * Starts a card payment for premium (SRS 6.2.1). Rejects with 409 if the
 * recipient is already ACTIVE premium (no stacking — mirrors subscribePremium).
 * Returns the Stripe Checkout URL; premium is granted later by the webhook.
 */
export async function createPremiumCheckout(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError("Session is no longer valid");
  }
  const profile = await recipientProfileRepository.findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }
  if (isPremiumActive(profile)) {
    throw new ConflictError("You already have an active premium subscription");
  }
  return paymentsFacade.createCheckoutSession({
    purpose: "premium",
    userId,
    amountVnd: PREMIUM_PRICE_VND,
    productName: "AFF Premium (1 month)",
    successPath: "/premium?status=success",
    cancelPath: "/premium?status=cancel",
  });
}

/**
 * Payment webhook handler for a completed premium Checkout Session (registered
 * with the payments module as purpose "premium"). Grants/extends premium
 * WITHOUT touching the wallet, idempotently by Stripe session id, then sends the
 * 6.1.2 confirmation email. Never throws for a duplicate delivery.
 */
export async function activatePremiumFromPayment(session) {
  const userId = session?.metadata?.userId;
  const stripeSessionId = session?.id;
  if (!userId || !stripeSessionId) {
    console.error("[premium] payment session missing userId or id");
    return;
  }

  const profile = await recipientProfileRepository.findByUserId(userId);
  if (!profile) {
    console.error(`[premium] no profile for user ${userId}`);
    return;
  }

  const now = new Date();
  const newExpiry = nextExpiry(profile, now, PREMIUM_DURATION_MONTHS);
  const updated = await recipientProfileRepository.activatePremiumForPayment(
    userId,
    newExpiry,
    stripeSessionId,
  );
  if (!updated) {
    // Already processed (duplicate webhook) — no-op.
    return;
  }

  const user = await userRepository.findById(userId);
  if (user?.email) {
    sendMail({
      to: user.email,
      ...premiumConfirmationEmail({
        premiumExpiryDate: newExpiry,
        amountVnd: PREMIUM_PRICE_VND,
      }),
    }).catch((error) => {
      console.error("[mail] premium confirmation failed", error);
    });
  }
}
