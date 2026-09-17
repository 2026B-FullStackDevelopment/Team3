import { useEffect, useState } from 'react';
import { formatDateTime, formatVnd } from '@/shared/utils/formatters.js';
import * as reservationService from './ReservationService.js';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400';

const STATUS_LABELS = {
  Reserved: 'Reserved (Pending Pickup)',
  CancelledByDonor: 'Cancelled by Donor',
  CancelledByAdmin: 'Cancelled by Admin',
};

function statusClasses(status) {
  return status === 'Reserved'
    ? 'border-orange-400 bg-orange-50 text-orange-600'
    : 'border-red-400 bg-red-50 text-red-700';
}

function getMapUrl(location) {
  const [longitude, latitude] = location?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const offset = 0.008;
  const params = new URLSearchParams({
    bbox: `${longitude - offset},${latitude - offset},${longitude + offset},${latitude + offset}`,
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function getDirectionsUrl(location) {
  const [longitude, latitude] = location?.coordinates ?? [];
  const destination = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude},${longitude}`
    : location?.municipality;
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination })}`;
}

export function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    async function loadReservations() {
      try {
        const data = await reservationService.fetchMyReservations();
        setReservations(data.reservations || []);
        setError(null);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadReservations();
  }, []);

  if (isLoading) {
    return <div className="py-10 text-center font-bold text-ink">Loading reservations...</div>;
  }

  if (error) {
    return <div className="py-10 text-center font-bold text-danger">Error: {error}</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">My Reservations</h1>
        <p className="mt-1 text-muted">Track pending pickups and cancelled reservations.</p>
      </div>

      {reservations.length === 0 ? (
        <div className="py-10 text-center text-muted">You have no pending or cancelled reservations.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {reservations.map((item) => {
            const donation = item.donation || {};
            return (
              <article key={item.id} className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-[#d9cba9] sm:w-56">
                  <span className="absolute top-2 left-2 z-10 rounded-full bg-[#e6efd6] px-3 py-1 text-xs font-bold text-ink">
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

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 className="text-xl font-bold text-ink">{donation.name || 'Unknown Item'}</h2>
                  <p className="mb-2 text-sm text-gray-500">{donation.donorName || 'Local Donor'}</p>
                  <p className="text-sm text-ink">Reserved on: {formatDateTime(item.reservedAt)}</p>
                  <p className="text-sm text-ink">Quantity: <strong>{item.quantity}</strong></p>
                  <p className="text-lg font-bold text-ink">
                    Total: {item.totalPaid === 0 ? 'FREE' : formatVnd(item.totalPaid)}
                  </p>
                  {item.totalPaid > 0 && item.paymentMethod && (
                    <p className="text-sm text-gray-500">Paid by {item.paymentMethod}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <div className={`rounded-full border px-4 py-1.5 text-xs font-bold ${statusClasses(item.status)}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </div>
                  {item.status === 'Reserved' && item.pickupLocation && (
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(item.pickupLocation)}
                      className="rounded-full bg-[#e6efd6] px-5 py-2.5 text-sm font-bold text-[#5f7d1f] transition-colors hover:bg-[#c9dca8]"
                    >
                      Direction to Pickup
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-80 w-full bg-blue-50">
              {getMapUrl(selectedLocation) ? (
                <iframe
                  title={`Map to ${selectedLocation.donorName || 'pickup location'}`}
                  src={getMapUrl(selectedLocation)}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-gray-600">
                  A map preview is unavailable because this donor has no saved coordinates.
                </div>
              )}
            </div>

            <a
              href={getDirectionsUrl(selectedLocation)}
              target="_blank"
              rel="noreferrer"
              className="m-4 flex items-center justify-between rounded-2xl bg-black p-4 text-white transition-colors hover:bg-gray-900"
            >
              <span>
                <strong className="block">{selectedLocation.donorName || 'Pickup location'}</strong>
                {selectedLocation.municipality || 'Municipality unavailable'}
              </span>
              <span className="ml-3 text-xs font-bold uppercase">Open Google Maps</span>
            </a>

            <button
              type="button"
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 rounded-full bg-white px-3 py-2 font-bold text-black shadow-md hover:bg-gray-100"
              aria-label="Close map"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
