/** Feedback API routes (SRS A.2.a, SRS 5.2.4). */
export const feedbackRoutes = {
  submit: (reservationId) => `/api/feedback/reservations/${reservationId}`,
}
