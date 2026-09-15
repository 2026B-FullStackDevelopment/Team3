/**
 * Reservation-facing Donation facade.
 *
 * Keeps Reservation coupled only to the operations Donation explicitly exposes
 * for checking and applying online reservations.
 */
export {
  readListingById,
  applyReservation,
  restoreReservationQuantity,
} from "./donation.interface.js";
