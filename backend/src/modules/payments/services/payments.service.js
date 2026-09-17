import { getStripe, isStripeEnabled } from "../../../config/stripe.js";
import { env } from "../../../config/env.js";
import { ConflictError } from "../../../shared/errors/errors.js";

// purpose -> async (session) => void. Modules register their fulfilment handler
// at startup (e.g. Identity registers "premium"); the webhook dispatches by the
// session's metadata.purpose. This keeps payments decoupled from consumers.
const handlers = new Map();

export function registerHandler(purpose, handler) {
  if (handlers.has(purpose)) {
    throw new Error(
      `Payment handler already registered for purpose "${purpose}"`,
    );
  }
  handlers.set(purpose, handler);
}

export async function dispatch(session) {
  const purpose = session?.metadata?.purpose;
  const handler = purpose ? handlers.get(purpose) : undefined;
  if (!handler) {
    console.log(
      `[payments] no handler for purpose "${purpose ?? "(none)"}" — ignoring`,
    );
    return;
  }
  await handler(session);
}

/**
 * Creates a Stripe Checkout Session for a one-off card payment and returns its
 * hosted URL. Fulfilment happens later via the webhook + a registered handler,
 * keyed by `purpose`. 409 if Stripe is not configured.
 */
export async function createCheckoutSession({
  purpose,
  userId,
  amountVnd,
  productName,
  successPath,
  cancelPath,
  metadata = {},
}) {
  if (!isStripeEnabled()) {
    throw new ConflictError("Card payment is not available");
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "vnd",
          product_data: { name: productName },
          unit_amount: amountVnd, // VND is zero-decimal — pass as-is, no ×100.
        },
        quantity: 1,
      },
    ],
    metadata: {
      ...metadata,
      userId: String(userId),
      purpose: String(purpose),
    },
    success_url: `${env.stripe.frontendUrl}${successPath}`,
    cancel_url: `${env.stripe.frontendUrl}${cancelPath}`,
  });
  return { url: session.url };
}
