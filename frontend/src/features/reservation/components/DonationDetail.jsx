import { useState } from 'react';

function getMapUrl(pickupLocation) {
  const [longitude, latitude] = pickupLocation?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const offset = 0.008;
  const params = new URLSearchParams({
    bbox: `${longitude - offset},${latitude - offset},${longitude + offset},${latitude + offset}`,
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

export default function DonationDetail({ item, onClose, onProceed }) {
  const mapUrl = getMapUrl(item.pickupLocation);
  const isPerRequest =
    item.reservationPolicy?.allowsOnlineReservation === false ||
    item.measurementUnit === 'PerRequest';
  const policyWarnings = item.reservationPolicy?.warningMessages ?? [];
  const remainingQuantity = Number(item.remainingQuantity ?? 0);
  const ration = Number(item.ration ?? 0);
  const hasRation = ration > 0;
  const limit = hasRation > 0 
    ? Math.min(ration, remainingQuantity) 
    : remainingQuantity;

  const isIncremental = item.measurementUnit?.toLowerCase() === 'unit';

  const [quantity, setQuantity] = useState(limit > 0 ? (isIncremental ? 1 : '') : 0);
  const [error, setError] = useState('');

  const handleQuantityChange = (val) => {
    // 1. Allow clearing the input
    if (val === '') {
      setQuantity('');
      setError('');
      return;
    }

    // 2. Prevent negative signs globally
    if (val.includes('-')) return;

    // 3. Prevent decimal points for incremental "Unit" items
    if (isIncremental && val.includes('.')) return;

    const parsed = Number(val);
    if (isNaN(parsed) || parsed < 0) return;

    setQuantity(parsed);

    // 4. Validate limit
    if (hasRation && parsed > ration) {
      setError('Error: Requested quantity exceeds ration limit.');
    } else if (parsed > remainingQuantity) {
      setError('Error: Requested quantity exceeds remaining quantity.');
    } else {
      setError('');
    }
  };

  const currentQuantity = Number(quantity) || 0;
  const totalPrice = currentQuantity * item.price;

  const handleReserveClick = () => {
    if (isPerRequest || currentQuantity > limit || currentQuantity <= 0) return;
    onProceed(currentQuantity, totalPrice);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content donation-detail">
        <div className="modal-image-container">
          <img src={item.imageUrl} alt={item.name} className="modal-image" />
        </div>
        <div className="modal-body">
          <h2>{item.name}</h2>
          <p className="donor-name">{item.donorName || 'Local Farm'}</p>
          
          <div className="stock-warning">
            <span className="units-left">{item.remainingQuantity} {item.measurementUnit} left</span>
            <span className="unit-price">
              {item.price === 0 ? 'FREE' : `${item.price.toLocaleString()} VND`}
            </span>
          </div>

          <section className="pickup-map" aria-label="Donor pickup location">
            <strong>Pickup location</strong>
            {item.pickupLocation?.municipality && (
              <span>{item.pickupLocation.municipality}</span>
            )}
            {mapUrl ? (
              <iframe
                title={`Pickup location for ${item.name}`}
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p>Map preview unavailable because the donor has no saved location.</p>
            )}
          </section>

          {isPerRequest && (
            <div className="reservation-policy-warning" role="status">
              <strong>This listing cannot be reserved online.</strong>
              <span>Contact or visit the donor to request this food.</span>
              {policyWarnings.length > 0 && (
                <ul>
                  {policyWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isPerRequest && <div className="limit-input">
            <input 
              type="text" 
              readOnly 
              value={hasRation
                    ? `Limit ${limit} ${item.measurementUnit} per person`
                    : `Up to ${limit} ${item.measurementUnit} available`} 
              className="limit-display"
            />
          </div>}

          {!isPerRequest && <div className="quantity-selector">
            {isIncremental ? (
              <>
                <button 
                  onClick={() => handleQuantityChange(String(currentQuantity - 1))}
                  disabled={currentQuantity <= 0}
                >-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  min="0"
                  step="1"
                  className="incremental-input"
                />
                <button 
                  onClick={() => handleQuantityChange(String(currentQuantity + 1))}
                  disabled={currentQuantity >= limit}
                >+</button>
              </>
            ) : (
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => handleQuantityChange(e.target.value)} 
                min="0"
                step="0.1"
                placeholder="0.0"
                className="custom-input"
              />
            )}
            <span className="unit-label">{item.measurementUnit}</span>
          </div>}

          <div className="modal-actions">
            <button 
              className="btn-reserve" 
              onClick={handleReserveClick}
              disabled={isPerRequest || !!error || currentQuantity <= 0}
            >
              {isPerRequest ? 'Online Reservation Unavailable' : 'Reserve'}
            </button>
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      {/* Moved outside modal-content to float below it */}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
