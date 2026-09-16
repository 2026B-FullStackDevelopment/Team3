import { useEffect, useState } from 'react';
import { FeedbackDisplay } from '@/features/feedback/Component/FeedbackDisplay.jsx';
import { FeedbackForm } from '@/features/feedback/Component/FeedbackForm.jsx';
import { useFeedbackRow } from '@/features/feedback/hooks/feedbackHooks.js';
import { formatDateTime, formatVnd } from '@/shared/utils/formatters.js';
import * as reservationService from './ReservationService.js';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400';

function HistoryItem({ item, onFeedbackSubmitted }) {
  const donation = item.donation || {};
  const { canLeaveFeedback, submit, isSubmitting, error } = useFeedbackRow(
    item,
    {
      onSuccess: (reservation, submittedText) =>
        onFeedbackSubmitted(
          item.id,
          reservation?.feedback ?? submittedText,
        ),
    },
  );

  return (
    <article className="flex flex-col items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
      <div className="flex w-full flex-col items-center gap-6 sm:w-auto sm:flex-row sm:items-start">
        <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-[#d9cba9] sm:w-56">
          <span className="absolute top-2 left-2 z-10 rounded-full bg-[#e6efd6] px-3 py-1 text-xs font-bold text-ink shadow-sm">
            {donation.foodCategory || 'Food'}
          </span>
          <img
            src={donation.imageUrl || IMAGE_FALLBACK}
            alt={donation.name || 'Food item'}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = IMAGE_FALLBACK;
            }}
          />
        </div>

        <div className="mt-2 flex w-full flex-col gap-1 text-left sm:mt-0 sm:w-auto">
          <h2 className="text-xl font-bold text-ink">{donation.name || 'Unknown Item'}</h2>
          <p className="mb-2 text-sm text-gray-500">{donation.donorName || 'Local Donor'}</p>
          <p className="text-sm font-medium text-ink">
            Collected on: <span className="font-normal">{formatDateTime(item.collectedAt)}</span>
          </p>
          <p className="text-sm font-medium text-ink">
            Quantity: <span className="font-bold">{item.quantity}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-ink">
            Total: {item.totalPaid === 0 ? 'FREE' : formatVnd(item.totalPaid)}
          </p>
          {item.totalPaid > 0 && item.paymentMethod && (
            <p className="text-sm text-gray-500">Paid by {item.paymentMethod}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex w-full shrink-0 flex-col items-end gap-4 sm:mt-0 sm:w-72">
        <div className="rounded-full border border-[#5f7d1f] bg-[#e6efd6]/50 px-4 py-1.5 text-xs font-bold text-[#5f7d1f]">
          Collected
        </div>

        {item.feedback ? (
          <div className="w-full"><FeedbackDisplay feedback={item.feedback} /></div>
        ) : canLeaveFeedback ? (
          <div className="w-full">
            <FeedbackForm onSubmit={submit} isSubmitting={isSubmitting} error={error} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await reservationService.fetchReservationHistory();
        setHistory(data.history || []);
        setError(null);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  function handleFeedbackSubmitted(reservationId, feedback) {
    setHistory((current) =>
      current.map((item) =>
        item.id === reservationId ? { ...item, feedback } : item,
      ),
    );
  }

  if (isLoading) {
    return <div className="py-10 text-center font-bold text-ink">Loading history...</div>;
  }

  if (error) {
    return <div className="py-10 text-center font-bold text-danger">Error: {error}</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="mb-2 text-3xl font-bold text-ink">Reservation History</h1>

      {history.length > 0 ? (
        <div className="flex flex-col gap-6">
          {history.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-muted">You have no reservation history.</div>
      )}
    </div>
  );
}
