import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDeleteDonation,
  useDonationMutation,
} from "@/features/donation/hooks/donation.hooks.js";
import { donationService } from "@/features/donation/service/donation.service.js";

export function useListingActions(listing) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(null);
  const statusMutation = useDonationMutation(({ id, status }) =>
    donationService.changeStatus(id, status),
  );
  const deleteMutation = useDeleteDonation();

  function changeStatus(status) {
    setConfirming(null);
    statusMutation.mutate({ id: listing.id, status });
  }

  function remove() {
    setConfirming(null);
    deleteMutation.mutate(listing.id);
  }

  return {
    changeStatus,
    clearConfirmation: () => setConfirming(null),
    confirming,
    error: statusMutation.error ?? deleteMutation.error,
    openManualDonation: () =>
      navigate(`/donor/manual-donations?listing=${listing.id}`),
    pending: statusMutation.isPending || deleteMutation.isPending,
    remove,
    requestConfirmation: setConfirming,
  };
}
