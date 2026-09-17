/**
 * Payments module public surface (Facade).
 *
 * Consumers create Checkout Sessions and register fulfilment handlers ONLY
 * through here. This module never imports another module — consumers depend on
 * it, not the reverse.
 */
import * as paymentsService from "./services/payments.service.js";

export function createCheckoutSession(args) {
  return paymentsService.createCheckoutSession(args);
}

export function registerHandler(purpose, handler) {
  return paymentsService.registerHandler(purpose, handler);
}
