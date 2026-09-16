import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as reservationService from './ReservationService.js';
import { useNotifications } from '@/features/notification/Hook/useNotifications.js';
import { profileService } from '@/features/identity/Service/profileService.js';

function requestCurrentLocation() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  });
}

export function useReservation() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listingNotice, setListingNotice] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const locationRef = useRef(null);
  const locationResolvedRef = useRef(false);
  const skipNextRouteLoadRef = useRef(false);

  // Modal and Flow State
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentStep, setCurrentStep] = useState('browse');

  const resolveBrowseLocation = useCallback(async () => {
    if (locationResolvedRef.current) return locationRef.current;
    const profileResult = await profileService.getProfile();
    const profile = profileResult.ok ? profileResult.data?.profile : null;
    locationRef.current = profile?.isPremium
      ? await requestCurrentLocation()
      : null;
    locationResolvedRef.current = true;
    return locationRef.current;
  }, []);

  const loadListingsAndBalance = useCallback(async (openLinkedListing = true) => {
    setIsLoading(true);
    try {
      const [location, balance] = await Promise.all([
        resolveBrowseLocation(),
        reservationService.fetchWalletBalance(),
      ]);
      const listingsData = await reservationService.fetchActiveDonation(location);
      const nextListings = listingsData.entries || listingsData;
      setListings(nextListings);
      setWalletBalance(balance);
      setError(null);
      setListingNotice(null);

      if (listingId && openLinkedListing) {
        const listed = nextListings.find(
          (item) => String(item._id || item.id) === String(listingId),
        );
        try {
          const target = listed
            ?? await reservationService.fetchActiveDonationById(listingId);
          setSelectedItem(target);
          setCurrentStep('detail');
        } catch (listingError) {
          setListingNotice(listingError.message);
          skipNextRouteLoadRef.current = true;
          navigate('/browse', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, navigate, resolveBrowseLocation]);

  useEffect(() => {
    if (skipNextRouteLoadRef.current) {
      skipNextRouteLoadRef.current = false;
      return;
    }
    // Initial async hydration intentionally updates this hook's loading state.
    loadListingsAndBalance();
  }, [loadListingsAndBalance]);

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
    if (listingId) {
      skipNextRouteLoadRef.current = true;
      navigate('/browse', { replace: true });
    }
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
        await loadListingsAndBalance(false);
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
    listingNotice,
    paymentError,
    selectedQuantity,
    selectedTotal,
    selectedItem,
    currentStep,
    openDonationDetail,
    proceedToPayment,
    closeModals,
    confirmReservation,
    refreshListings: () => loadListingsAndBalance(false)
  };
}
