export const donationKeys = {
  all: ["donations"],
  lists: ["donations", "list"],
  list: (filters = {}) => ["donations", "list", filters],
  detail: (id) => ["donations", "detail", id],
  report: (filters = {}) => ["donations", "report", filters],
  listingDonations: (id, filters = {}) => ["donations", "listing-donations", id, filters],
};
