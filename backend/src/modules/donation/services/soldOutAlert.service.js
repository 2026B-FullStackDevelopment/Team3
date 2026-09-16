function toPlainDonation(donation) {
  if (!donation) return donation;
  return typeof donation.toObject === "function"
    ? donation.toObject()
    : donation;
}

export const SoldOutAlertEventName = "donation:sold-out";

export function buildSoldOutAlert(donation) {
  const listing = toPlainDonation(donation);
  const closedAt = listing.closedAt ?? new Date();

  return {
    event: SoldOutAlertEventName,
    donorProfileId: String(listing.donorProfileId),
    donationId: String(listing._id ?? listing.id),
    donationName: listing.name,
    closedAt: closedAt.toISOString(),
    message: `${listing.name} is sold out.`,
  };
}
