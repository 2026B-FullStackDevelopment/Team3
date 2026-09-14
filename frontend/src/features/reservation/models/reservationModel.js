/** Mirrors backend/src/modules/reservation/models/Reservation.js's ReservationStatus. */
export const ReservationStatus = Object.freeze({
  Reserved: 'Reserved',
  CollectedByRecipient: 'CollectedByRecipient',
  Collected: 'Collected',
  CancelledByDonor: 'CancelledByDonor',
})

/** SRS 5.2.4: feedback can only be left once a reservation has been collected. */
export function isFeedbackEligible(status) {
  return (
    status === ReservationStatus.Collected ||
    status === ReservationStatus.CollectedByRecipient
  )
}

/** Normalizes a raw (Mongoose, donationId-populated) reservation into a display view-model. */
export function formatReservation(entry) {
  const donation =
    entry.donationId && typeof entry.donationId === 'object' ? entry.donationId : null

  return {
    id: entry._id ?? entry.id,
    donationName: donation?.name ?? 'Deleted listing',
    foodCategory: donation?.foodCategory ?? null,
    quantity: entry.quantity,
    status: entry.status,
    totalPaid: entry.totalPaid,
    paymentMethod: entry.paymentMethod ?? null,
    reservedAt: entry.reservedAt ?? null,
    collectedAt: entry.collectedAt ?? null,
    feedback: entry.feedback ?? null,
  }
}
