import * as walletService from "../services/wallet.service.js";
import { validateDeposit, validateTopUp } from "../validators/wallet.validators.js";
import { getStripe } from "../../../config/stripe.js";
import { env } from "../../../config/env.js";

/**
 * GET /api/wallet  (protected — requireAuth + requireRole Recipient)
 * Returns the current recipient's wallet balance.
 */
export async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getBalance(req.user.userId);
    res.status(200).json({ wallet });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/wallet/deposit  (protected — requireAuth + requireRole Recipient)
 * Validates the amount, credits the wallet, returns the new balance + the
 * recorded transaction.
 */
export async function deposit(req, res, next) {
  try {
    const { amount } = validateDeposit(req.body);
    const result = await walletService.deposit(req.user.userId, amount);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/wallet/transactions  (protected — requireAuth + requireRole Recipient)
 * Returns the current recipient's transactions, newest first.
 */
export async function listTransactions(req, res, next) {
  try {
    const transactions = await walletService.listTransactions(req.user.userId);
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/wallet/topup/session  (protected — requireAuth + requireRole Recipient)
 * Validates the amount and returns a Stripe Checkout URL for the frontend to
 * redirect to. 409 if Stripe is not configured.
 */
export async function createTopUpSession(req, res, next) {
  try {
    const { amount } = validateTopUp(req.body);
    const result = await walletService.createTopUpSession(req.user.userId, amount);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/wallet/stripe/webhook  (unauthenticated — the signature is the auth)
 * Verifies the Stripe signature over the RAW body, then credits the wallet on
 * checkout.session.completed. Returns 400 on a bad signature, 500 if crediting
 * fails (so Stripe retries), 200 otherwise.
 */
export async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer — see stripeWebhook.routes.js
      signature,
      env.stripe.webhookSecret,
    );
  } catch {
    console.error("[stripe] webhook signature verification failed");
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await walletService.creditTopUp(
        session.metadata.userId,
        session.amount_total, // Stripe-confirmed amount (VND, zero-decimal)
        session.id,
      );
      console.log(`[stripe] top-up processed: session ${session.id}`);
    } catch (error) {
      console.error(`[stripe] credit failed for event ${event.id}`, error);
      return res.status(500).json({ error: "CREDIT_FAILED" });
    }
  }
  return res.status(200).json({ received: true });
}
