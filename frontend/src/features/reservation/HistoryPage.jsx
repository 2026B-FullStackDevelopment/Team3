import { useState, useEffect } from 'react';
import * as reservationService from './ReservationService.js';

const HISTORY_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400';

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
    donorName: donor?.companyName || 'Local Donor',
    address: donor?.address || donor?.city || 'Pickup address unavailable',
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
  };
}

function getMapUrl({ latitude, longitude }) {
  if (latitude === null || longitude === null) return null;
  const offset = 0.008;
  const params = new URLSearchParams({
    bbox: `${longitude - offset},${latitude - offset},${longitude + offset},${latitude + offset}`,
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

function getDirectionsUrl(location) {
  const destination =
    location.latitude !== null && location.longitude !== null
      ? `${location.latitude},${location.longitude}`
      : location.address;
  const params = new URLSearchParams({ api: '1', destination });
  return `https://www.google.com/maps/dir/?${params}`;
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
        // The backend controller wraps the array in a "history" key
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Pending';
    const d = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${d.toLocaleDateString('en-US', options)} - ${d.toLocaleTimeString('en-US', timeOptions)}`;
  };

  if (isLoading) return <div className="text-center py-10 font-bold text-ink">Loading history...</div>;
  if (error) return <div className="text-center py-10 font-bold text-danger">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-ink mb-2">Reservation History</h1>
      
      <div className="flex flex-col gap-6">
        {history.length > 0 ? history.map((item) => {
          // Check against the exact backend ReservationStatus enum
          const isCollected = item.status === 'Collected' || item.status === 'CollectedByRecipient';
          
          // The backend populates the donation details needed by each history card.
          const donation = item.donationId || {};
          const pickupLocation = getPickupLocation(donation);
          
          return (
            <div key={item._id} className="bg-white rounded-[1.5rem] p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-gray-100">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full sm:w-auto">
                <div className="relative w-full sm:w-56 h-36 bg-[#d9cba9] rounded-xl overflow-hidden shrink-0">
                  <span className="absolute top-2 left-2 bg-[#e6efd6] text-ink px-3 py-1 rounded-full text-xs font-bold z-10 shadow-sm">
                    {donation.foodCategory || 'Food'}
                  </span>
                  <img
                    src={donation.imageUrl || HISTORY_IMAGE_FALLBACK}
                    alt={donation.name || 'Food item'}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = HISTORY_IMAGE_FALLBACK;
                    }}
                  />
                </div>
                
                <div className="flex flex-col w-full sm:w-auto text-left gap-1 mt-2 sm:mt-0">
                  <h3 className="text-xl font-bold text-ink">{donation.name || 'Unknown Item'}</h3>
                  <p className="text-sm text-gray-500 mb-2">{pickupLocation.donorName}</p>
                  
                  <p className="text-sm text-ink font-medium">
                    Reserved on: <span className="font-normal">{formatDateTime(item.reservedAt)}</span>
                  </p>
                  <p className="text-sm text-ink font-medium">
                    Quantity: <span className="font-bold">{item.quantity}</span>
                  </p>
                  <p className="text-lg font-bold text-ink mt-1">
                    Total: {item.totalPaid === 0 ? 'FREE' : `${(item.totalPaid || 0).toLocaleString()} VND`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                {isCollected ? (
                  <div className="px-4 py-1.5 rounded-full border border-[#5f7d1f] text-[#5f7d1f] text-xs font-bold bg-[#e6efd6]/50">
                    Collected
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded-full border border-orange-400 text-orange-600 text-xs font-bold bg-orange-50">
                    Reserved (Pending Pickup)
                  </div>
                )}

                {!isCollected && (
                  <button 
                    onClick={() => setSelectedLocation(pickupLocation)}
                    className="bg-[#e6efd6] text-[#5f7d1f] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#c9dca8] transition-colors w-full sm:w-auto mt-auto"
                  >
                    DIRECTION TO PICKUP
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-10 text-muted">You have no reservation history.</div>
        )}
      </div>

      {/* Map Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg relative shadow-2xl">
            <div className="w-full h-80 bg-blue-50">
              {getMapUrl(selectedLocation) ? (
                <iframe
                  title={`Map to ${selectedLocation.donorName}`}
                  src={getMapUrl(selectedLocation)}
                  className="h-full w-full border-0"
                  loading="lazy"
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
              className="m-4 bg-black text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium leading-snug">
                  <strong className="block">{selectedLocation.donorName}</strong>
                  {selectedLocation.address}
                </span>
              </div>
              <span className="ml-3 shrink-0 text-xs font-bold uppercase">Get directions</span>
            </a>
            <button onClick={() => setSelectedLocation(null)} className="absolute top-4 right-4 bg-white text-black rounded-full p-2 shadow-md hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
