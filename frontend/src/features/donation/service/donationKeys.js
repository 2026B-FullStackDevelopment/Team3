export const donationKeys = {
  all: ["donations"],
  list: (filters = {}) => ["donations", "list", filters],
  detail: (id) => ["donations", "detail", id],
  history: (id, page = 1) => ["donations", "history", id, page],
  report: (filters = {}) => ["donations", "report", filters],
};
