import Stripe from "stripe";
import { env } from "./env.js";

let client = null;

/**
 * True only when BOTH the secret key and the webhook secret are configured.
 * Requiring both prevents a dangerous half-configured state: with a secret key
 * but no webhook secret, a user could pay on Stripe while the webhook signature
 * check always fails (400) — money taken, wallet never credited. Gating on both
 * keeps the simulated /deposit fallback active until Stripe is fully wired.
 */
export function isStripeEnabled() {
  return Boolean(env.stripe.secretKey) && Boolean(env.stripe.webhookSecret);
}

/**
 * Lazily builds and memoizes the Stripe client so the app boots without keys.
 * Throws if called while Stripe is disabled — callers must guard with
 * isStripeEnabled() first.
 */
export function getStripe() {
  if (!isStripeEnabled()) {
    throw new Error("Stripe is not configured");
  }
  if (!client) {
    client = new Stripe(env.stripe.secretKey);
  }
  return client;
}
