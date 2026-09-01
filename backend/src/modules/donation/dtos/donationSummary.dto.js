/**
 * Maps a Donation document to the shape exposed across the module boundary
 * (SRS A.3.2) for Admin-facing operations -- the diagram's "DonationSummaryDTO".
 */
export function toDonationSummaryDTO(donation) {
  return {
    id: donation._id ?? donation.id,
    name: donation.name,
    donorProfileId: donation.donorProfileId,
    status: donation.status,
    foodCategory: donation.foodCategory,
    measurementUnit: donation.measurementUnit,
    price: donation.price,
    remainingQuantity: donation.remainingQuantity,
    revenue: donation.revenue,
    createdAt: donation.createdAt,
    closedAt: donation.closedAt,
  };
}
