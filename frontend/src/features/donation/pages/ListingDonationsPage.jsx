import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useCollectReservation,
  useDonationDetail,
  useListingDonations,
} from "@/features/donation/hooks/donation.hooks.js";
import { DonationPageHeader } from "@/features/donation/components/DonationUI.jsx";
import { StatusAlert } from "@/shared/components/status-alert.jsx";
import { Pagination } from "@/shared/components/Pagination.jsx";
import { formatDateTime, formatVnd } from "@/shared/utils/formatters.js";

const PAGE_SIZE = 20;

/** Donor's per-listing reservations, including any feedback left by recipients (SRS 4.2.5). */
export function ListingDonationsPage() {
  const { listingId } = useParams();
  const [page, setPage] = useState(1);
  const listing = useDonationDetail(listingId);
  const donations = useListingDonations(listingId, { page, limit: PAGE_SIZE });
  const collectReservation = useCollectReservation(listingId);
  const entries = donations.data?.entries ?? [];
  const totalPages = donations.data?.metadata?.totalPages ?? 1;

  function handleCollect(entry) {
    const recipient = entry.recipientUsername ?? "this recipient";
    if (
      !window.confirm(`Confirm that ${recipient} collected this reservation?`)
    ) {
      return;
    }
    collectReservation.mutate(entry.id);
  }

  return (
    <div className="donation-page">
      <DonationPageHeader
        eyebrow="Reservations"
        title={listing.data ? listing.data.name : "Listing reservations"}
        description="Everyone who has reserved or collected this listing, including any feedback they've left."
        actions={
          <Link className="button-secondary" to="/donor/listings">
            Back to My Listings
          </Link>
        }
      />

      {donations.isLoading && (
        <StatusAlert variant="loading" title="Loading reservations" />
      )}
      {donations.isError && (
        <StatusAlert variant="danger" title="Unable to load reservations">
          {donations.error.message}
        </StatusAlert>
      )}
      {collectReservation.isError && (
        <StatusAlert variant="danger" title="Reservation was not updated">
          {collectReservation.error.message}
        </StatusAlert>
      )}
      {donations.data && entries.length === 0 && (
        <div className="donation-empty">
          <h3>No reservations yet</h3>
          <p>
            Once recipients reserve or collect this listing, they&apos;ll show
            up here.
          </p>
        </div>
      )}

      {donations.data && entries.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-aff-border text-xs font-semibold uppercase tracking-wide text-aff-muted">
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Quantity</th>
                <th className="py-2 pr-4">Paid</th>
                <th className="py-2 pr-4">Collected</th>
                <th className="py-2 pr-4">Feedback</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-aff-border/60 last:border-0"
                >
                  <td className="py-3 pr-4">
                    {entry.recipientUsername ?? "—"}
                  </td>
                  <td className="py-3 pr-4">{entry.status}</td>
                  <td className="py-3 pr-4">{entry.quantity}</td>
                  <td className="py-3 pr-4">
                    {entry.totalPaid > 0
                      ? `${formatVnd(entry.totalPaid)} (${entry.paymentMethod ?? "—"})`
                      : "Free"}
                  </td>
                  <td className="py-3 pr-4">
                    {entry.collectedAt
                      ? formatDateTime(entry.collectedAt)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">{entry.feedback ?? "—"}</td>
                  <td className="py-3">
                    {entry.rawStatus === "Reserved" ? (
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={collectReservation.isPending}
                        onClick={() => handleCollect(entry)}
                      >
                        {collectReservation.isPending &&
                        collectReservation.variables === entry.id
                          ? "Marking…"
                          : "Mark as collected"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
