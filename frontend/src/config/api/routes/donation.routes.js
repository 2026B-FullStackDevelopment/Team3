/** Donation / food-listing API routes (SRS A.2.a). Skeleton — built with the Donation module. */
export const donationRoutes = {
  listings: '/api/donor/food-listings',
  listing: (id) => `/api/donor/food-listings/${id}`,
  duplicate: (id) => `/api/donor/food-listings/${id}/duplicate`,
  status: (id) => `/api/donor/food-listings/${id}/status`,
  ration: (id) => `/api/donor/food-listings/${id}/ration`,
  donations: (id) => `/api/donor/food-listings/${id}/donations`,
  reports: '/api/donor/reports/dashboard',
}
