import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useDonationDetail,
  useDonationHistory,
  useDonationList,
} from "@/features/donation/hooks/useDonationData.js";
import {
  formatDateTime,
  formatQuantityWithUnit,
  formatVnd,
} from "@/lib/formatters.js";
import {
  DonationPageHeader,
  ListingCard,
} from "@/features/donation/components/DonationUI.jsx";
import { StatusAlert } from "@/components/ui/status-alert.jsx";

export function ReservationSelectorPage() {
  const [search, setSearch] = useState("");
  const listings = useDonationList({ includeClosed: true, limit: 100 });
  const filtered = useMemo(
    () =>
      (listings.data?.entries ?? []).filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [listings.data, search],
  );
  return (
    <div className="donation-page">
      <DonationPageHeader
        eyebrow="Donation records"
        title="Reservation & Handoff History"
        description="Choose a current or historical listing to review its collected and reserved entries."
      />
      <label className="history-search">
        Search listings
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by listing name"
        />
      </label>
      {listings.isLoading && (
        <StatusAlert variant="loading" title="Loading listings" />
      )}
      {listings.isError && (
        <StatusAlert variant="danger" title="Unable to load listings">
          {listings.error.message}
        </StatusAlert>
      )}
      <div className="selector-grid">
        {filtered.map((listing) => (
          <Link
            className="selector-card"
            key={listing.id}
            to={`/donor/listings/${listing.id}/reservations`}
          >
            <span>
              <strong>{listing.name}</strong>
              <small>
                {formatQuantityWithUnit(
                  listing.remainingQuantity,
                  listing.measurementUnit,
                )}{" "}
                remaining
              </small>
            </span>
            <em>{listing.status}</em>
          </Link>
        ))}
      </div>
      {listings.data && filtered.length === 0 && (
        <div className="donation-empty">
          <h2>No matching listings</h2>
          <p>Try another search or create a new listing.</p>
        </div>
      )}
    </div>
  );
}

export function ReservationHistoryPage() {
  const { listingId } = useParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const detail = useDonationDetail(listingId);
  const history = useDonationHistory(listingId, page);
  const entries = (history.data?.entries ?? []).filter(
    (entry) => !status || entry.status === status,
  );
  return (
    <div className="donation-page">
      <DonationPageHeader
        eyebrow="Listing details"
        title="Reservation History"
        description="Live reservation and manual handoff records for this listing."
        actions={
          <Link className="button-secondary" to="/donor/reservations">
            Choose another listing
          </Link>
        }
      />
      {detail.isLoading && (
        <StatusAlert variant="loading" title="Loading listing" />
      )}
      {detail.isError && (
        <StatusAlert variant="danger" title="Listing not found">
          The listing is unavailable or does not belong to this donor.
        </StatusAlert>
      )}
      {detail.data && <ListingCard listing={detail.data} compact />}
      <section className="donation-section history-section">
        <div className="history-toolbar">
          <div>
            <h2>Donation entries</h2>
            <p>Filters apply to this page only.</p>
          </div>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Reserved">Reserved</option>
            <option value="Collected">Collected</option>
            <option value="CollectedByRecipient">Collected by Recipient</option>
            <option value="CancelledByDonor">Cancelled by Donor</option>
          </select>
        </div>
        {history.isLoading && (
          <StatusAlert variant="loading" title="Loading donation history" />
        )}
        {history.isError && (
          <StatusAlert
            variant="danger"
            title="Unable to load history"
            action={<button onClick={() => history.refetch()}>Retry</button>}
          >
            {history.error.message}
          </StatusAlert>
        )}
        {history.data && entries.length === 0 && (
          <div className="donation-empty">
            <h3>No donation entries yet</h3>
            <p>Reservations and recorded manual handoffs will appear here.</p>
          </div>
        )}
        {entries.length > 0 && (
          <div className="history-table-wrap">
            <table className="history-table">
              <caption className="sr-only">
                Donation history for {detail.data?.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Reserved</th>
                  <th scope="col">Collected</th>
                  <th scope="col">Status</th>
                  <th scope="col">Total paid</th>
                  <th scope="col">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id ?? index}>
                    <td>{(page - 1) * 20 + index + 1}</td>
                    <td>{entry.recipientUsername ?? "Not recorded"}</td>
                    <td>{entry.quantity}</td>
                    <td>
                      {entry.reservedAt
                        ? formatDateTime(entry.reservedAt)
                        : "Not recorded"}
                    </td>
                    <td>
                      {entry.collectedAt
                        ? formatDateTime(entry.collectedAt)
                        : "Not recorded"}
                    </td>
                    <td>
                      <span className="history-status">
                        {entry.status ?? "Unknown"}
                      </span>
                    </td>
                    <td>
                      {Number(entry.totalPaid) === 0
                        ? "Free"
                        : formatVnd(entry.totalPaid)}
                    </td>
                    <td>{entry.feedback ?? "Not recorded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {history.data && (
          <div className="pagination">
            <button
              disabled={!history.data.metadata.hasPreviousPage}
              onClick={() => {
                setPage((value) => value - 1);
                setStatus("");
              }}
            >
              Previous
            </button>
            <span>
              Page {history.data.metadata.page ?? page} of{" "}
              {history.data.metadata.totalPages || 1}
            </span>
            <button
              disabled={!history.data.metadata.hasNextPage}
              onClick={() => {
                setPage((value) => value + 1);
                setStatus("");
              }}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
