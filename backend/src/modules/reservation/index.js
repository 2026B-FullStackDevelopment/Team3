/** Reservation module public surface and startup wiring. */
import * as paymentsFacade from "../payments/index.js";
import { fulfillReservationCheckout } from "./services/reservationService.js";

export function registerPaymentHandlers() {
  paymentsFacade.registerHandler("reservation", fulfillReservationCheckout);
}
