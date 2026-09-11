import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { donationService } from "@/features/donation/service/donationService.js";
import { donationKeys } from "@/features/donation/service/donationKeys.js";

/** Fetches and caches the donation listings that match the supplied filters. */
export function useDonationList(filters = {}) {
  return useQuery({
    queryKey: donationKeys.list(filters),
    queryFn: ({ signal }) => donationService.list(filters, signal),
  });
}

/** Fetches and caches one donation listing when a valid ID is available. */
export function useDonationDetail(id) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: ({ signal }) => donationService.detail(id, signal),
    enabled: Boolean(id),
  });
}

/** Fetches and caches one page of donation activity for a listing. */
export function useDonationHistory(id, page) {
  return useQuery({
    queryKey: donationKeys.history(id, page),
    queryFn: ({ signal }) => donationService.history(id, page, signal),
    enabled: Boolean(id),
  });
}

/** Fetches and caches donation report data using optional React Query settings. */
export function useDonationReport(filters = {}, options = {}) {
  return useQuery({
    queryKey: donationKeys.report(filters),
    queryFn: ({ signal }) => donationService.report(filters, signal),
    ...options,
  });
}

/** Creates a mutation hook that refreshes donation caches after a successful change. */
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

/** Deletes a donation listing and refreshes all cached donation data afterward. */
export function useDeleteDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: donationService.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donationKeys.all }),
  });
}
