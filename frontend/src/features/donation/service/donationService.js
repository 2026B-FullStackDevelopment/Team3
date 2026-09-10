import { apiFetch } from "@/lib/api/apiFetch.js";
import { normalizeDonationListing } from "@/lib/donation.js";
import { donationRoutes } from "@/config/api/routes/index.js";

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

function unwrapListing(payload) {
  return normalizeDonationListing(payload?.listing ?? payload);
}

export const donationService = {
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

  async detail(id, signal) {
    return unwrapListing(
      await apiFetch(donationRoutes.listing(id), { signal }),
    );
  },

  async create(body) {
    return unwrapListing(
      await apiFetch(donationRoutes.listings, { method: "POST", body }),
    );
  },

  async update(id, body) {
    return unwrapListing(
      await apiFetch(donationRoutes.listing(id), { method: "PATCH", body }),
    );
  },

  async duplicate(id, body) {
    return unwrapListing(
      await apiFetch(donationRoutes.duplicate(id), { method: "POST", body }),
    );
  },

  async changeStatus(id, status) {
    return unwrapListing(
      await apiFetch(donationRoutes.status(id), {
        method: "PATCH",
        body: { status },
      }),
    );
  },

  async changeRation(id, ration) {
    return unwrapListing(
      await apiFetch(donationRoutes.ration(id), {
        method: "PATCH",
        body: { ration },
      }),
    );
  },

  remove(id) {
    return apiFetch(donationRoutes.listing(id), { method: "DELETE" });
  },

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

  async history(id, page = 1, signal) {
    const payload = await apiFetch(
      `${donationRoutes.donations(id)}${queryString({ page, limit: 20 })}`,
      { signal },
    );
    return {
      entries: payload?.entries ?? [],
      metadata: payload?.metadata ?? {},
    };
  },

  async report(filters = {}, signal) {
    const payload = await apiFetch(
      `${donationRoutes.reports}${queryString(filters)}`,
      { signal },
    );
    return {
      generatedAt: payload?.generatedAt ?? null,
      totalDonatedQuantity: Number(payload?.totalDonatedQuantity ?? 0),
      totalRevenue: Number(payload?.totalRevenue ?? 0),
      donationCount: Number(payload?.donationCount ?? 0),
      byCategory: Array.isArray(payload?.byCategory) ? payload.byCategory : [],
      byMeasurementUnit: Array.isArray(payload?.byMeasurementUnit)
        ? payload.byMeasurementUnit
        : [],
    };
  },
};
