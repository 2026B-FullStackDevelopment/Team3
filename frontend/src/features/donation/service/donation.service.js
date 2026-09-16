import { httpClient, unwrapHttpResponse } from "@/shared/api/apiFetch.js";
import { normalizeDonationListing } from "@/features/donation/models/donation.js";
import { normalizeListingDonation } from "@/features/donation/models/listingDonation.js";
import { donationRoutes } from "@/config/api/routes/index.js";

/** Extracts a listing from an API response and normalizes its frontend shape. */
function unwrapListing(payload) {
  return normalizeDonationListing(payload?.listing ?? payload);
}

/** Converts report values to non-negative numbers and falls back to zero. */
function toSafeReportNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

/** Normalizes each category or measurement-unit row returned by a report. */
function normalizeReportBreakdown(entries) {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => ({
    label: String(entry?.label || "Unknown"),
    donatedQuantity: toSafeReportNumber(entry?.donatedQuantity),
    donationCount: toSafeReportNumber(entry?.donationCount),
    revenue: toSafeReportNumber(entry?.revenue),
  }));
}

/** Builds the multipart form payload used to create a listing with an image. */
export function buildDonationCreateFormData(body, image) {
  const formData = new FormData();
  formData.append("image", image);
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value === null ? "null" : String(value));
    }
  });
  return formData;
}

export const donationService = {
  /** Fetches a filtered list of donation listings with pagination metadata. */
  async list(filters = {}, signal) {
    const payload = unwrapHttpResponse(
      await httpClient.get(donationRoutes.listings, {
        params: filters,
        signal,
      }),
    );
    return {
      entries: (payload?.entries ?? []).map(normalizeDonationListing),
      metadata: payload?.metadata ?? {},
    };
  },

  /** Fetches and normalizes one donation listing by its ID. */
  async detail(id, signal) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.get(donationRoutes.listing(id), { signal }),
      ),
    );
  },

  /** Creates a donation listing by sending its fields and required image. */
  async create(body, image) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.post(
          donationRoutes.listings,
          buildDonationCreateFormData(body, image),
        ),
      ),
    );
  },

  /** Updates the editable fields of an existing donation listing. */
  async update(id, body) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.patch(donationRoutes.listing(id), body),
      ),
    );
  },

  /** Creates a new listing from an existing listing and supplied overrides. */
  async duplicate(id, body) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.post(donationRoutes.duplicate(id), body),
      ),
    );
  },

  /** Changes only the current status of a donation listing. */
  async changeStatus(id, status) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.patch(donationRoutes.status(id), { status }),
      ),
    );
  },

  /** Changes the maximum quantity one recipient may reserve from a listing. */
  async changeRation(id, ration) {
    return unwrapListing(
      unwrapHttpResponse(
        await httpClient.patch(donationRoutes.ration(id), { ration }),
      ),
    );
  },

  /** Deletes a donation listing by its ID. */
  remove(id) {
    return httpClient
      .delete(donationRoutes.listing(id))
      .then(unwrapHttpResponse);
  },

  /** Fetches the paginated list of reservations/donations for one listing (SRS 4.2.5). */
  async listingDonations(id, filters = {}, signal) {
    const payload = unwrapHttpResponse(
      await httpClient.get(donationRoutes.donations(id), {
        params: filters,
        signal,
      }),
    );
    return {
      entries: (payload?.entries ?? []).map(normalizeListingDonation),
      metadata: payload?.metadata ?? {},
    };
  },

  /** Confirms that a reserved donation has been collected by its recipient. */
  async collectReservation(id, reservationId) {
    const payload = unwrapHttpResponse(
      await httpClient.patch(
        donationRoutes.collectReservation(id, reservationId),
      ),
    );
    return normalizeListingDonation(payload?.reservation);
  },

  /** Records an in-person donation and returns its updated normalized listing. */
  async manualDonation(id, body) {
    const payload = unwrapHttpResponse(
      await httpClient.post(donationRoutes.manualDonations(id), body),
    );
    return {
      ...payload,
      listing: normalizeDonationListing(payload.listing),
    };
  },

  /** Fetches dashboard report totals and safely normalizes chart breakdowns. */
  async report(filters = {}, signal) {
    const payload = unwrapHttpResponse(
      await httpClient.get(donationRoutes.reports, {
        params: filters,
        signal,
      }),
    );
    return {
      generatedAt: payload?.generatedAt ?? null,
      periodStart: payload?.periodStart ?? null,
      periodEnd: payload?.periodEnd ?? null,
      totalDonatedQuantity: toSafeReportNumber(payload?.totalDonatedQuantity),
      totalRevenue: toSafeReportNumber(payload?.totalRevenue),
      donationCount: toSafeReportNumber(payload?.donationCount),
      byCategory: normalizeReportBreakdown(payload?.byCategory),
      byMeasurementUnit: normalizeReportBreakdown(payload?.byMeasurementUnit),
    };
  },
};
