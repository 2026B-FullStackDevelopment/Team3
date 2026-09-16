import {
  httpClient,
  unwrapHttpResponse,
} from "@/shared/api/apiFetch.js";
import {
  donationRoutes,
  reservationRoutes,
  walletRoutes,
} from "@/config/api/routes/index.js";

export async function createCheckoutSession(donationId, quantity) {
  return httpClient.post(reservationRoutes.checkout, { donationId, quantity });
}

export async function fetchActiveDonation(params = {}) {
  return unwrapHttpResponse(
    await httpClient.get(donationRoutes.active, { params }),
  );
}

export async function fetchActiveDonationById(donationId) {
  const data = unwrapHttpResponse(
    await httpClient.get(donationRoutes.activeListing(donationId)),
  );
  return data.listing;
}

export async function fetchWalletBalance() {
  const data = unwrapHttpResponse(await httpClient.get(walletRoutes.get));
  return data.wallet.balance;
}

export async function createReservation(reservationData) {
  return unwrapHttpResponse(
    await httpClient.post(reservationRoutes.reservations, reservationData),
  );
}

export async function fetchReservationHistory() {
  return unwrapHttpResponse(await httpClient.get(reservationRoutes.history));
}

export async function fetchMyReservations() {
  return unwrapHttpResponse(await httpClient.get(reservationRoutes.mine));
}
