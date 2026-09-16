const STATUS_LABELS = Object.freeze({
  Reserved: "Reserved",
  Collected: "Collected",
  CollectedByRecipient: "Collected",
  CancelledByRecipient: "Cancelled by recipient",
  CancelledByDonor: "Cancelled by donor",
});

/** Converts a backend reservation status into the four SRS 4.2.5 labels. */
export function normalizeListingDonation(entry) {
  const rawStatus = String(entry?.status ?? "");
  const readableFallback = rawStatus
    ? rawStatus.replace(/([a-z])([A-Z])/g, "$1 $2")
    : "Unknown";

  return {
    ...entry,
    rawStatus,
    status: STATUS_LABELS[rawStatus] ?? readableFallback,
  };
}
