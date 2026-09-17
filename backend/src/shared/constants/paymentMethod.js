/**
 * Payment methods — shared vocabulary used by Reservation, Wallet and Donation.
 * Lives in shared/ so no module reaches into another module's internals for it
 * (ARCHITECTURE §2: cross-module coupling goes through shared/ or a facade,
 * never a direct import of another module's model).
 */
export const PaymentMethod = {
  Cash: "Cash",
  Wallet: "Wallet",
  Card: "Card",
};
