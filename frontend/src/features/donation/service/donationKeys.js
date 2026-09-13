export const donationKeys = {
  all: ["donations"],
  list: (filters = {}) => ["donations", "list", filters],
  detail: (id) => ["donations", "detail", id],
  report: (filters = {}) => ["donations", "report", filters],
};
