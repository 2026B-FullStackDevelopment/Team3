// frontend/src/features/reservation/components/DonationDetail.jsx
import React, { useState } from 'react';

export default function DonationDetail({ item, onClose, onProceed }) {
  // Determine maximum allowable quantity
  const limit = item.ration > 0 
    ? Math.min(item.ration, item.remainingQuantity) 
    : item.remainingQuantity;

  const [quantity, setQuantity] = useState(limit > 0 ? 1 : 0);
  const [error, setError] = useState('');

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity === '' || isNaN(newQuantity)) {
      setQuantity('');
      return;
    }

    const parsed = Number(newQuantity);
    setQuantity(parsed);

    // Validate against limits
    if (parsed > limit) {
      setError(`Error: Quantity exceeds the limit. Please reduce your quantity.`);
    } else if (parsed <= 0) {
      setError('Error: Please enter a valid quantity.');
    } else {
      setError('');
    }
  };

  // Calculate dynamic total price
  const currentQuantity = Number(quantity) || 0;
  const totalPrice = currentQuantity * item.price;

  const handleReserveClick = () => {
    if (currentQuantity > limit || currentQuantity <= 0) return;
    onProceed(currentQuantity, totalPrice);
  };

  // Determine step size for the input based on measurement unit
  const stepSize = (item.measurementUnit === 'KG' || item.measurementUnit === 'L') ? "0.1" : "1";

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
            
            {/* Added: Unit Price Display */}
            <span className="unit-price">
              {item.price === 0 ? 'FREE' : `${item.price.toLocaleString()} VND / ${item.measurementUnit}`}
            </span>
          </div>

          <div className="limit-input">
            <input 
              type="text" 
              readOnly 
              value={`Limit ${limit} ${item.measurementUnit} per person`} 
              className="limit-display"
            />
          </div>

          <div className="quantity-selector">
            <button onClick={() => handleQuantityChange(currentQuantity - Number(stepSize))}>-</button>
            <input 
              type="number" 
              value={quantity} 
              onChange={(e) => handleQuantityChange(e.target.value)} 
              step={stepSize}
              min="0"
            />
            <span className="unit-label">{item.measurementUnit}</span>
            <button onClick={() => handleQuantityChange(currentQuantity + Number(stepSize))}>+</button>
          </div>

          {/* Added: Dynamic Total Price */}
          <div className="total-price-display">
            <strong>Total: </strong>
            <span className={error ? 'error-text' : ''}>
              {totalPrice === 0 ? '0 VND' : `${totalPrice.toLocaleString()} VND`}
            </span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="modal-actions">
            <button 
              className="btn-reserve" 
              onClick={handleReserveClick}
              disabled={!!error || currentQuantity <= 0}
            >
              Reserve
            </button>
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}