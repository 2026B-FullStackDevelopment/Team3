import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { donationService } from "@/features/donation/service/donationService.js";
import { donationKeys } from "@/features/donation/service/donationKeys.js";

export function useDonationList(filters = {}) {
  return useQuery({
    queryKey: donationKeys.list(filters),
    queryFn: ({ signal }) => donationService.list(filters, signal),
  });
}

export function useDonationDetail(id) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: ({ signal }) => donationService.detail(id, signal),
    enabled: Boolean(id),
  });
}

export function useDonationHistory(id, page) {
  return useQuery({
    queryKey: donationKeys.history(id, page),
    queryFn: ({ signal }) => donationService.history(id, page, signal),
    enabled: Boolean(id),
  });
}

export function useDonationReport(filters = {}) {
  return useQuery({
    queryKey: donationKeys.report(filters),
    queryFn: ({ signal }) => donationService.report(filters, signal),
  });
}

export function useDonationMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (listing) => {
      if (listing?.id)
        queryClient.setQueryData(donationKeys.detail(listing.id), listing);
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
  });
}

export function useDeleteDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: donationService.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donationKeys.all }),
  });
}
