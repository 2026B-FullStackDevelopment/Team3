function getId(value) {
  const id = value?._id ?? value?.id ?? value;
  return id === undefined || id === null ? null : String(id);
}

/** Safe response returned after a recipient creates a reservation. */
export function toReservationCreatedDTO(reservation) {
  if (!reservation) return reservation;

  return {
    id: getId(reservation),
    donationId: getId(reservation.donationId),
    quantity: reservation.quantity,
    status: reservation.status,
    totalPaid: reservation.totalPaid,
    paymentMethod: reservation.paymentMethod ?? null,
    reservedAt: reservation.reservedAt ?? null,
  };
}

/** Safe collection-history response; never exposes raw donor profile data. */
export function toReservationHistoryDTO(reservation) {
  if (!reservation) return reservation;

  const donation = reservation.donationId;
  const donor = donation?.donorProfileId;

  return {
    id: getId(reservation),
    donation: donation
      ? {
          id: getId(donation),
          name: donation.name,
          foodCategory: donation.foodCategory,
          imageUrl: donation.imageUrl ?? null,
          donorName: donor?.companyName ?? null,
        }
      : null,
    quantity: reservation.quantity,
    status: reservation.status,
    totalPaid: reservation.totalPaid,
    paymentMethod: reservation.paymentMethod ?? null,
    collectedAt: reservation.collectedAt ?? null,
    feedback: reservation.feedback ?? null,
  };
}

/** Safe pending/cancelled reservation response for the owning recipient. */
export function toMyReservationDTO(reservation) {
  if (!reservation) return reservation;

  const donation = reservation.donationId;
  const donor = donation?.donorProfileId;
  const coordinates = donor?.location?.coordinates;

  return {
    id: getId(reservation),
    donation: donation
      ? {
          id: getId(donation),
          name: donation.name,
          foodCategory: donation.foodCategory,
          imageUrl: donation.imageUrl ?? null,
          donorName: donor?.companyName ?? null,
        }
      : null,
    quantity: reservation.quantity,
    status: reservation.status,
    totalPaid: reservation.totalPaid,
    paymentMethod: reservation.paymentMethod ?? null,
    reservedAt: reservation.reservedAt ?? null,
    pickupLocation:
      reservation.status === "Reserved" && Array.isArray(coordinates)
        ? {
            donorName: donor?.companyName ?? null,
            municipality: donor?.city ?? null,
            coordinates: [...coordinates],
          }
        : null,
  };
}
