/** Read-only display of feedback already submitted on a reservation. */
export function FeedbackDisplay({ feedback }) {
  return (
    <div className="mt-3 rounded-xl bg-khaki/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your feedback</p>
      <p className="mt-1 text-sm text-ink">{feedback}</p>
    </div>
  )
}
