// frontend/src/features/reservation/ReservationView.jsx
import { useReservation } from "./ReservationHook.js";
import FoodBrowsing from "./components/FoodBrowsing.jsx";
import DonationDetail from "./components/DonationDetail.jsx";
import Payment from "./components/Payment.jsx";
import HistoryView from "./HistoryView.jsx";
import "./Reservation.css";

export default function ReservationView() {
  const {
    listings,
    isLoading,
    error,
    selectedItem,
    currentStep,
    selectedQuantity,
    selectedTotal,
    walletBalance,
    openDonationDetail,
    proceedToPayment,
    closeModals,
    confirmReservation,
  } = useReservation();

  return (
    <div className="reservation-container">
      <header className="reservation-header">
        <h1>Welcome Back!</h1>
        <p>Find Surplus Food Near You</p>
      </header>

      <FoodBrowsing
        listings={listings}
        isLoading={isLoading}
        error={error}
        onSelectItem={openDonationDetail}
      />

      {currentStep === "detail" && selectedItem && (
        <DonationDetail
          item={selectedItem}
          onClose={closeModals}
          onProceed={proceedToPayment}
        />
      )}

      {currentStep === "payment" && selectedItem && (
        <Payment
          item={selectedItem}
          quantity={selectedQuantity}
          totalPrice={selectedTotal}
          walletBalance={walletBalance}
          onClose={closeModals}
          onConfirm={confirmReservation}
        />
      )}

      <HistoryView />
    </div>
  );
}
