import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, HandCoins } from "lucide-react";
import { useDonationList } from "@/features/donation/hooks/useDonationData.js";
import { DonationStatus } from "@/lib/donation.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";
import {
  DonationFilters,
  DonationPageHeader,
  DonationReportPanel,
  ListingSection,
} from "@/features/donation/components/DonationUI.jsx";

const defaultFilters = {
  search: "",
  foodCategory: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function DonationDashboardPage({ listingsOnly = false }) {
  const [filters, setFilters] = useState(defaultFilters);
  const requestFilters = useMemo(
    () => ({
      includeClosed: true,
      limit: 100,
      ...filters,
    }),
    [filters],
  );
  const query = useDonationList(requestFilters);
  const entries = query.data?.entries ?? [];
  const current = entries.filter(
    (listing) =>
      !listing.closedAt &&
      [
        DonationStatus.ACTIVE,
        DonationStatus.PAUSED,
        DonationStatus.PENDING_CANCELLATION,
      ].includes(listing.status),
  );
  const past = entries.filter(
    (listing) =>
      listing.closedAt ||
      [DonationStatus.CANCELLED, DonationStatus.SOLD_OUT].includes(
        listing.status,
      ),
  );

  return (
    <div className="donation-page">
      <DonationPageHeader
        eyebrow={listingsOnly ? "Donation workspace" : "Donor dashboard"}
        title={listingsOnly ? "My Listings" : "Welcome Back, Donor!"}
        description={
          listingsOnly
            ? "Manage current and past food listings."
            : "Here is an overview of your donation activity."
        }
        actions={
          <>
            <Link className="button-secondary" to="/donor/manual-donations">
              <HandCoins size={18} /> Input Cash Received
            </Link>
            <Link className="button-primary" to="/donor/listings/new">
              <Plus size={18} /> Create New Listing
            </Link>
          </>
        }
      />
      <DonationFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(defaultFilters)}
      />
      {query.isLoading && (
        <StatusAlert variant="loading" title="Loading donation listings">
          The latest donor records are being retrieved.
        </StatusAlert>
      )}
      {query.isError && (
        <StatusAlert
          variant="danger"
          title="Unable to load listings"
          action={<button onClick={() => query.refetch()}>Retry</button>}
        >
          {query.error.message}
        </StatusAlert>
      )}
      {query.data?.metadata?.total > 100 && (
        <StatusAlert variant="warning" title="Showing the latest 100 listings">
          Older records are not included in this view.
        </StatusAlert>
      )}
      {query.data && (
        <div className={listingsOnly ? "" : "dashboard-grid"}>
          <div className="dashboard-listings">
            <ListingSection
              title="Your Active Donations"
              listings={current}
              emptyTitle={
                filters.search || filters.foodCategory
                  ? "No matching listings found"
                  : "No active donations"
              }
              emptyCopy={
                filters.search || filters.foodCategory
                  ? "Clear the filters to see all donation listings."
                  : "Create a listing to begin receiving reservations and recording handoffs."
              }
            />
            <ListingSection
              title="Your Past Donations"
              listings={past}
              emptyTitle="No past donations"
              emptyCopy="Closed and sold-out listings will appear here."
            />
          </div>
          {!listingsOnly && <DonationReportPanel />}
        </div>
      )}
    </div>
  );
}
