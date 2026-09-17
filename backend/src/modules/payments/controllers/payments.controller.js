import * as paymentsService from "../services/payments.service.js";
import { getStripe } from "../../../config/stripe.js";
import { env } from "../../../config/env.js";

/**
 * POST /api/payments/stripe/webhook  (unauthenticated — the signature is the auth)
 * Verifies the Stripe signature over the RAW body, then dispatches
 * checkout.session.completed to the handler registered for its purpose. 400 on a
 * bad signature, 500 if a handler throws (so Stripe retries), 200 otherwise.
 */
export async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.stripe.webhookSecret,
    );
  } catch {
    console.error("[payments] webhook signature verification failed");
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await paymentsService.dispatch(event.data.object);
      console.log(`[payments] processed session ${event.data.object.id}`);
    } catch (error) {
      console.error(`[payments] handler failed for event ${event.id}`, error);
      return res.status(500).json({ error: "HANDLER_FAILED" });
    }
  }
  return res.status(200).json({ received: true });
}
