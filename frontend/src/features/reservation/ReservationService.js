import {
  httpClient,
  unwrapHttpResponse,
} from "@/shared/api/apiFetch.js";
import {
  reservationRoutes,
  walletRoutes,
} from "@/config/api/routes/index.js";

export async function createCheckoutSession(donationId, quantity) {
  return httpClient.post(reservationRoutes.checkout, { donationId, quantity });
}

export async function fetchActiveDonation() {
  const response = await fetch("/api/donations/active", {
    method: "GET",
    headers: { "Content-type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch active donations");
  }

  return response.json();
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
