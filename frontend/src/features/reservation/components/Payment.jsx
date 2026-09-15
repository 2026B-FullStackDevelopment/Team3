import React, { useState } from 'react';

export default function Payment({ item, quantity, totalPrice, walletBalance, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
  const isInsufficient = paymentMethod === 'Wallet' && totalPrice > walletBalance;

  const handleConfirm = () => {
    if (isInsufficient) return;
    onConfirm(paymentMethod);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-detail">
        {/* Left side: Item Image (from mockups) */}
        <div className="modal-image-container">
          <img src={item.imageUrl} alt={item.name} className="modal-image" />
        </div>

        {/* Right side: Payment Selection */}
        <div className="modal-body">
          <h2>Select Payment</h2>
          <p className="donor-name">{item.name} - {item.donorName || 'Local Farm'}</p>
          
          <div className="payment-options">
            {/* Cash Option */}
            <label className={`payment-option ${paymentMethod === 'Cash' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Cash"
                checked={paymentMethod === 'Cash'}
                onChange={() => setPaymentMethod('Cash')}
              />
              <div className="payment-info">
                <strong>Cash on Collection</strong>
                <span>Pay directly at the store</span>
              </div>
            </label>

            {/* Wallet Option */}
            <label className={`payment-option ${paymentMethod === 'Wallet' ? 'selected' : ''} ${totalPrice > walletBalance ? 'disabled' : ''}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="Wallet"
                checked={paymentMethod === 'Wallet'}
                onChange={() => setPaymentMethod('Wallet')}
              />
              <div className="payment-info">
                <strong>AFF Wallet</strong>
                <span>Balance: {walletBalance.toLocaleString()} VND</span>
                {totalPrice > walletBalance && (
                  <span className="error-text">
                    ⚠️ Insufficient balance for this order ({totalPrice.toLocaleString()} VND)
                  </span>
                )}
              </div>
            </label>
          </div>

          <div className="total-price-display">
            <strong>Total to Pay: </strong>
            <span>{totalPrice === 0 ? 'FREE' : `${totalPrice.toLocaleString()} VND`}</span>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-reserve" 
              onClick={handleConfirm}
              disabled={isInsufficient}
            >
              Confirm Payment
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