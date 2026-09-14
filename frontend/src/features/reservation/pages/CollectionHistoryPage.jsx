import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { Card } from '@/shared/components/Card.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useCollectionHistory } from '@/features/reservation/hooks/reservationHooks.js'
import { useFeedbackRow } from '@/features/feedback/hooks/feedbackHooks.js'
import { FeedbackForm } from '@/features/feedback/Component/FeedbackForm.jsx'
import { FeedbackDisplay } from '@/features/feedback/Component/FeedbackDisplay.jsx'
import { CATEGORY_LABELS } from '@/lib/donation.js'
import { formatVND, formatShortDate } from '@/shared/utils/format.js'

/** One collected reservation (SRS 5.1.4) with its feedback form/display (5.2.4). */
function HistoryRow({ entry }) {
  const { canLeaveFeedback, submit, isSubmitting, error } = useFeedbackRow(entry)

  return (
    <Card className="mb-4">
      <p className="font-semibold text-ink">{entry.donationName}</p>
      <p className="text-sm text-muted">
        {entry.donorName}
        {' · '}
        {CATEGORY_LABELS[entry.foodCategory] ?? entry.foodCategory ?? 'Uncategorized'}
        {' · '}
        {entry.quantity}
        {' · '}
        {formatShortDate(entry.collectedAt)}
      </p>

      <p className="mt-2 text-sm text-muted">
        {entry.totalPaid > 0
          ? `${formatVND(entry.totalPaid)} · ${entry.paymentMethod ?? 'Unknown method'}`
          : 'Free'}
      </p>

      {entry.feedback ? (
        <FeedbackDisplay feedback={entry.feedback} />
      ) : canLeaveFeedback ? (
        <FeedbackForm onSubmit={submit} isSubmitting={isSubmitting} error={error} />
      ) : null}
    </Card>
  )
}

/** Recipient collection history (SRS 5.1.4), doubling as the host for feedback (5.2.4). */
export function CollectionHistoryPage() {
  const { data: entries, isLoading, isError, error } = useCollectionHistory()

  return (
    <>
      <PageHeader
        title="Collection History"
        subtitle="Food you've collected, plus feedback you've left for donors."
      />

      {isLoading && <p className="text-muted">Loading your history…</p>}
      {isError && <Alert variant="error">{error.message}</Alert>}

      {entries && entries.length === 0 && (
        <Card>
          <p className="text-muted">You haven&apos;t collected anything yet.</p>
        </Card>
      )}

      {entries?.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} />
      ))}
    </>
  )
}
