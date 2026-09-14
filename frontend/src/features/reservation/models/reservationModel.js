/** Mirrors backend/src/modules/reservation/models/Reservation.js's ReservationStatus. */
export const ReservationStatus = Object.freeze({
  Reserved: 'Reserved',
  CollectedByRecipient: 'CollectedByRecipient',
  Collected: 'Collected',
  CancelledByDonor: 'CancelledByDonor',
  CancelledByAdmin: 'CancelledByAdmin',
})

/** True once a reservation has actually been collected (SRS 5.1.4 / 5.2.4). */
export function isCollected(status) {
  return (
    status === ReservationStatus.Collected ||
    status === ReservationStatus.CollectedByRecipient
  )
}

/**
 * Normalizes a raw (Mongoose, donationId->donorProfileId-populated) reservation
 * into a display view-model. The backend only ever returns collected entries
 * here (SRS 5.1.4), so collectedAt is always present — no reservedAt fallback.
 */
export function formatReservation(entry) {
  const donation =
    entry.donationId && typeof entry.donationId === 'object' ? entry.donationId : null
  const donor =
    donation?.donorProfileId && typeof donation.donorProfileId === 'object'
      ? donation.donorProfileId
      : null

  return {
    id: entry._id ?? entry.id,
    donationName: donation?.name ?? 'Deleted listing',
    donorName: donor?.companyName ?? 'Unknown donor',
    foodCategory: donation?.foodCategory ?? null,
    quantity: entry.quantity,
    status: entry.status,
    totalPaid: entry.totalPaid,
    paymentMethod: entry.paymentMethod ?? null,
    collectedAt: entry.collectedAt ?? null,
    feedback: entry.feedback ?? null,
  }
}
