import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { Card } from '@/shared/components/Card.jsx'
import { Badge } from '@/shared/components/Badge.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useCollectionHistory } from '@/features/reservation/hooks/reservationHooks.js'
import {
  ReservationStatus,
  isFeedbackEligible,
} from '@/features/reservation/models/reservationModel.js'
import { useSubmitFeedback } from '@/features/feedback/hooks/feedbackHooks.js'
import { FeedbackForm } from '@/features/feedback/Component/FeedbackForm.jsx'
import { FeedbackDisplay } from '@/features/feedback/Component/FeedbackDisplay.jsx'
import { CATEGORY_LABELS } from '@/lib/donation.js'
import { formatVND, formatShortDate } from '@/shared/utils/format.js'

function statusVariant(status) {
  if (status === ReservationStatus.Reserved) return 'khaki'
  if (status === ReservationStatus.CancelledByDonor) return 'danger'
  return 'success'
}

function HistoryRow({ entry }) {
  const submitFeedback = useSubmitFeedback()
  const canLeaveFeedback = isFeedbackEligible(entry.status) && !entry.feedback

  return (
    <Card className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{entry.donationName}</p>
          <p className="text-sm text-muted">
            {CATEGORY_LABELS[entry.foodCategory] ?? entry.foodCategory ?? 'Uncategorized'}
            {' · '}
            {entry.quantity} {'· '}
            {formatShortDate(entry.collectedAt ?? entry.reservedAt)}
          </p>
        </div>
        <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
      </div>

      <p className="mt-2 text-sm text-muted">
        {entry.totalPaid > 0
          ? `${formatVND(entry.totalPaid)} · ${entry.paymentMethod ?? 'Unknown method'}`
          : 'Free'}
      </p>

      {entry.feedback ? (
        <FeedbackDisplay feedback={entry.feedback} />
      ) : canLeaveFeedback ? (
        <FeedbackForm
          onSubmit={(text) =>
            submitFeedback.mutate({ reservationId: entry.id, feedback: text })
          }
          isSubmitting={submitFeedback.isPending}
          error={submitFeedback.error?.message}
        />
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
        subtitle="Food you've reserved and collected, plus feedback you've left for donors."
      />

      {isLoading && <p className="text-muted">Loading your history…</p>}
      {isError && <Alert variant="error">{error.message}</Alert>}

      {entries && entries.length === 0 && (
        <Card>
          <p className="text-muted">You haven&apos;t reserved anything yet.</p>
        </Card>
      )}

      {entries?.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} />
      ))}
    </>
  )
}
