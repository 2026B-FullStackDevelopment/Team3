import { useEffect, useState } from "react";
import { FeedbackDisplay } from "@/features/feedback/Component/FeedbackDisplay.jsx";
import { FeedbackForm } from "@/features/feedback/Component/FeedbackForm.jsx";
import { useFeedbackRow } from "@/features/feedback/hooks/feedbackHooks.js";
import * as reservationService from "./ReservationService.js";

const HISTORY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400";

function getPickupLocation(donation) {
  const donor = donation?.donorProfileId;
  const coordinates = donor?.location?.coordinates;
  const longitude = Number(coordinates?.[0]);
  const latitude = Number(coordinates?.[1]);
  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return {
    donorName: donor?.companyName || "Local Donor",
    address: donor?.address || donor?.city || "Pickup address unavailable",
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
  };
}

function getMapUrl({ latitude, longitude }) {
  if (latitude === null || longitude === null) return null;

  const offset = 0.008;
  const params = new URLSearchParams({
    bbox: `${longitude - offset},${latitude - offset},${longitude + offset},${latitude + offset}`,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function getDirectionsUrl(location) {
  const destination =
    location.latitude !== null && location.longitude !== null
      ? `${location.latitude},${location.longitude}`
      : location.address;
  const params = new URLSearchParams({ api: "1", destination });
  return `https://www.google.com/maps/dir/?${params}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "Pending";

  const date = new Date(dateString);
  const options = { month: "long", day: "numeric", year: "numeric" };
  const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  return `${date.toLocaleDateString("en-US", options)} - ${date.toLocaleTimeString("en-US", timeOptions)}`;
}

function HistoryItem({ item, onSelectLocation, onFeedbackSubmitted }) {
  const reservationId = item._id ?? item.id;
  const donation = item.donationId || {};
  const pickupLocation = getPickupLocation(donation);
  const isCollected =
    item.status === "Collected" || item.status === "CollectedByRecipient";
  const { canLeaveFeedback, submit, isSubmitting, error } = useFeedbackRow(
    { ...item, id: reservationId },
    {
      onSuccess: (reservation, submittedText) =>
        onFeedbackSubmitted(
          reservationId,
          reservation?.feedback ?? submittedText,
        ),
    },
  );

  return (
    <article className="flex flex-col items-center justify-between rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
      <div className="flex w-full flex-col items-center gap-6 sm:w-auto sm:flex-row sm:items-start">
        <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-[#d9cba9] sm:w-56">
          <span className="absolute top-2 left-2 z-10 rounded-full bg-[#e6efd6] px-3 py-1 text-xs font-bold text-ink shadow-sm">
            {donation.foodCategory || "Food"}
          </span>
          <img
            src={donation.imageUrl || HISTORY_IMAGE_FALLBACK}
            alt={donation.name || "Food item"}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = HISTORY_IMAGE_FALLBACK;
            }}
          />
        </div>

        <div className="mt-2 flex w-full flex-col gap-1 text-left sm:mt-0 sm:w-auto">
          <h2 className="text-xl font-bold text-ink">
            {donation.name || "Unknown Item"}
          </h2>
          <p className="mb-2 text-sm text-gray-500">
            {pickupLocation.donorName}
          </p>
          <p className="text-sm font-medium text-ink">
            {isCollected ? "Collected on" : "Reserved on"}:{" "}
            <span className="font-normal">
              {formatDateTime(isCollected ? item.collectedAt : item.reservedAt)}
            </span>
          </p>
          <p className="text-sm font-medium text-ink">
            Quantity: <span className="font-bold">{item.quantity}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-ink">
            Total:{" "}
            {item.totalPaid === 0
              ? "FREE"
              : `${(item.totalPaid || 0).toLocaleString()} VND`}
          </p>
          {item.totalPaid > 0 && item.paymentMethod && (
            <p className="text-sm text-gray-500">
              Paid by {item.paymentMethod}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex w-full shrink-0 flex-col items-end gap-4 sm:mt-0 sm:w-72">
        {isCollected ? (
          <div className="rounded-full border border-[#5f7d1f] bg-[#e6efd6]/50 px-4 py-1.5 text-xs font-bold text-[#5f7d1f]">
            Collected
          </div>
        ) : (
          <div className="rounded-full border border-orange-400 bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600">
            Reserved (Pending Pickup)
          </div>
        )}

        {item.feedback ? (
          <div className="w-full">
            <FeedbackDisplay feedback={item.feedback} />
          </div>
        ) : canLeaveFeedback ? (
          <div className="w-full">
            <FeedbackForm
              onSubmit={submit}
              isSubmitting={isSubmitting}
              error={error}
            />
          </div>
        ) : null}

        {!isCollected && (
          <button
            type="button"
            onClick={() => onSelectLocation(pickupLocation)}
            className="mt-auto w-full rounded-full bg-[#e6efd6] px-6 py-2.5 text-sm font-bold text-[#5f7d1f] transition-colors hover:bg-[#c9dca8] sm:w-auto"
          >
            DIRECTION TO PICKUP
          </button>
        )}
      </div>
    </article>
  );
}

export function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
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
        (item._id ?? item.id) === reservationId ? { ...item, feedback } : item,
      ),
    );
  }

  if (isLoading) {
    return (
      <div className="py-10 text-center font-bold text-ink">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center font-bold text-danger">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="mb-2 text-3xl font-bold text-ink">
        Reservation History
      </h1>

      <div className="flex flex-col gap-6">
        {history.length > 0 ? (
          history.map((item) => (
            <HistoryItem
              key={item._id ?? item.id}
              item={item}
              onSelectLocation={setSelectedLocation}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          ))
        ) : (
          <div className="py-10 text-center text-muted">
            You have no reservation history.
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-80 w-full bg-blue-50">
              {getMapUrl(selectedLocation) ? (
                <iframe
                  title={`Map to ${selectedLocation.donorName}`}
                  src={getMapUrl(selectedLocation)}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-gray-600">
                  A map preview is unavailable because this donor has no saved
                  coordinates.
                </div>
              )}
            </div>
            <a
              href={getDirectionsUrl(selectedLocation)}
              target="_blank"
              rel="noreferrer"
              className="m-4 flex items-center justify-between rounded-2xl bg-black p-4 text-white transition-colors hover:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm leading-snug font-medium">
                  <strong className="block">
                    {selectedLocation.donorName}
                  </strong>
                  {selectedLocation.address}
                </span>
              </div>
              <span className="ml-3 shrink-0 text-xs font-bold uppercase">
                Get directions
              </span>
            </a>
            <button
              type="button"
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 rounded-full bg-white p-2 text-black shadow-md hover:bg-gray-100"
              aria-label="Close map"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
