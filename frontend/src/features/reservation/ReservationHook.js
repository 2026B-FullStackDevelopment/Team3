import { useState, useEffect } from 'react';
import * as reservationService from './ReservationService.js';
import { useNotifications } from '@/features/notification/Hook/useNotifications.js';

export function useReservation() {
  const { showToast } = useNotifications();
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Modal and Flow State
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentStep, setCurrentStep] = useState('browse');

  const loadListingsAndBalance = async () => {
    setIsLoading(true);
    try {
      const [listingsData, balance] = await Promise.all([
        reservationService.fetchActiveDonation(),
        reservationService.fetchWalletBalance()
      ]);
      setListings(listingsData.entries || listingsData);
      setWalletBalance(balance);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial async hydration intentionally updates this hook's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadListingsAndBalance();
  }, []);

  const openDonationDetail = (item) => {
    setPaymentError(null);
    setSelectedItem(item);
    setCurrentStep('detail');
  };

  const proceedToPayment = (quantity, total) => {
    setPaymentError(null);
    setSelectedQuantity(quantity);
    setSelectedTotal(total);
    setCurrentStep('payment');
  };

  const closeModals = () => {
    setPaymentError(null);
    setSelectedItem(null);
    setSelectedQuantity(0);
    setSelectedTotal(0);
    setCurrentStep('browse');
  };

  const confirmReservation = async (paymentMethod) => {
    setIsLoading(true);
    setPaymentError(null);

    if (paymentMethod === 'Card') {
      const res = await reservationService.createCheckoutSession(
        selectedItem._id || selectedItem.id,
        selectedQuantity,
      );

      if (res.ok) {
        window.location.href = res.data.url;
        return;
      }

      setPaymentError(res.error?.message || res.error);
      setIsLoading(false);
      return;
    }

    try {
        await reservationService.createReservation({
            // Handle both _id and id depending on exactly how your backend formats it
            donationId: selectedItem._id || selectedItem.id, 
            quantity: selectedQuantity,
            paymentMethod,
            manualRecipientName: "Self" // Since recipients book for themselves online
        });
        
        const reservedItemName = selectedItem.name || 'Food item';

        // Close the payment modal and refresh the grid/balance
        closeModals();
        await loadListingsAndBalance();
        showToast({
          type: 'ReservationCreated',
          title: 'Reservation successful',
          message: `${selectedQuantity} unit${selectedQuantity === 1 ? '' : 's'} of ${reservedItemName} reserved successfully.`,
        });
    } catch (err) {
        setPaymentError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return {
    walletBalance,
    listings,
    isLoading,
    error,
    paymentError,
    selectedQuantity,
    selectedTotal,
    selectedItem,
    currentStep,
    openDonationDetail,
    proceedToPayment,
    closeModals,
    confirmReservation,
    refreshListings: loadListingsAndBalance
  };
}
