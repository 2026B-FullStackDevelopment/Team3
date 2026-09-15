import { apiFetch } from "@/lib/api/apiFetch.js";
import { normalizeDonationListing } from "@/lib/donation.js";
import { donationRoutes } from "@/config/api/routes/index.js";

/** Converts a filters object into a URL query string, skipping empty values. */
function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

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
    const payload = await apiFetch(
      `${donationRoutes.listings}${queryString(filters)}`,
      { signal },
    );
    return {
      entries: (payload?.entries ?? []).map(normalizeDonationListing),
      metadata: payload?.metadata ?? {},
    };
  },

  /** Fetches and normalizes one donation listing by its ID. */
  async detail(id, signal) {
    return unwrapListing(
      await apiFetch(donationRoutes.listing(id), { signal }),
    );
  },

  /** Creates a donation listing by sending its fields and required image. */
  async create(body, image) {
    return unwrapListing(
      await apiFetch(donationRoutes.listings, {
        method: "POST",
        body: buildDonationCreateFormData(body, image),
      }),
    );
  },

  /** Updates the editable fields of an existing donation listing. */
  async update(id, body) {
    return unwrapListing(
      await apiFetch(donationRoutes.listing(id), { method: "PATCH", body }),
    );
  },

  /** Creates a new listing from an existing listing and supplied overrides. */
  async duplicate(id, body) {
    return unwrapListing(
      await apiFetch(donationRoutes.duplicate(id), { method: "POST", body }),
    );
  },

  /** Changes only the current status of a donation listing. */
  async changeStatus(id, status) {
    return unwrapListing(
      await apiFetch(donationRoutes.status(id), {
        method: "PATCH",
        body: { status },
      }),
    );
  },

  /** Changes the maximum quantity one recipient may reserve from a listing. */
  async changeRation(id, ration) {
    return unwrapListing(
      await apiFetch(donationRoutes.ration(id), {
        method: "PATCH",
        body: { ration },
      }),
    );
  },

  /** Deletes a donation listing by its ID. */
  remove(id) {
    return apiFetch(donationRoutes.listing(id), { method: "DELETE" });
  },

  /** Records an in-person donation and returns its updated normalized listing. */
  async manualDonation(id, body) {
    const payload = await apiFetch(
      `${donationRoutes.listing(id)}/manual-donations`,
      {
        method: "POST",
        body,
      },
    );
    return {
      ...payload,
      listing: normalizeDonationListing(payload.listing),
    };
  },

  /** Fetches dashboard report totals and safely normalizes chart breakdowns. */
  async report(filters = {}, signal) {
    const payload = await apiFetch(
      `${donationRoutes.reports}${queryString(filters)}`,
      { signal },
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
