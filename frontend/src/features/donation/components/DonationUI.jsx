import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Copy,
  HandCoins,
  Leaf,
  PackageOpen,
  Pencil,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { donationService } from "@/features/donation/service/donationService.js";
import {
  useDeleteDonation,
  useDonationMutation,
  useDonationReport,
} from "@/features/donation/hooks/useDonationData.js";
import {
  CATEGORY_LABELS,
  DonationStatus,
  STATUS_LABELS,
} from "@/lib/donation.js";
import {
  formatDate,
  formatQuantityWithUnit,
  formatVnd,
} from "@/lib/formatters.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

export function DonationPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="donation-page-header">
      <div>
        {eyebrow && <p className="donation-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="donation-header-actions">{actions}</div>}
    </header>
  );
}

export function DonationFilters({ filters, onChange, onClear }) {
  return (
    <div className="donation-filters" aria-label="Filter donation listings">
      <label className="donation-search">
        <span className="sr-only">Search by listing name</span>
        <input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search by listing name"
        />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <select
          value={filters.foodCategory}
          onChange={(event) =>
            onChange({ ...filters, foodCategory: event.target.value })
          }
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Sort listings</span>
        <select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            onChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="revenue:desc">Highest revenue</option>
          <option value="revenue:asc">Lowest revenue</option>
        </select>
      </label>
      <button className="button-quiet" type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`donation-status status-${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ListingArtwork({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = !listing.imageUrl || imageFailed;

  return (
    <div
      className={`listing-art category-${listing.foodCategory} ${fallback ? "" : "has-image"}`}
    >
      {fallback ? (
        <PackageOpen aria-hidden="true" />
      ) : (
        <img
          src={listing.imageUrl}
          alt={`${listing.name} donation food`}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

export function ListingCard({ listing, compact = false }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(null);
  const statusMutation = useDonationMutation(({ id, status }) =>
    donationService.changeStatus(id, status),
  );
  const deleteMutation = useDeleteDonation();
  const pending = statusMutation.isPending || deleteMutation.isPending;
  const closed =
    listing.closedAt ||
    [DonationStatus.CANCELLED, DonationStatus.SOLD_OUT].includes(
      listing.status,
    );
  const donated =
    listing.donationLimit > 0
      ? Math.max(listing.donationLimit - listing.remainingQuantity, 0)
      : null;

  function changeStatus(status) {
    setConfirming(null);
    statusMutation.mutate({ id: listing.id, status });
  }

  return (
    <article
      className={`listing-card ${compact ? "listing-card-compact" : ""}`}
    >
      <ListingArtwork listing={listing} />
      <div className="listing-body">
        <div className="listing-title-row">
          <div>
            <div className="listing-badges">
              <span>
                {CATEGORY_LABELS[listing.foodCategory] ?? listing.foodCategory}
              </span>
              {listing.isVegetarian && (
                <span>
                  <Leaf size={13} /> Vegetarian
                </span>
              )}
            </div>
            <h3>{listing.name}</h3>
            <p className="listing-quantity">
              {formatQuantityWithUnit(
                listing.remainingQuantity,
                listing.measurementUnit,
              )}{" "}
              remaining
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        {!compact && (
          <dl className="listing-metrics">
            <div>
              <dt>Price</dt>
              <dd>{listing.price === 0 ? "Free" : formatVnd(listing.price)}</dd>
            </div>
            <div>
              <dt>Donated</dt>
              <dd>
                {donated === null
                  ? "Not tracked"
                  : formatQuantityWithUnit(donated, listing.measurementUnit)}
              </dd>
            </div>
            <div>
              <dt>Revenue</dt>
              <dd>{formatVnd(listing.revenue)}</dd>
            </div>
            <div>
              <dt>{closed ? "Closed on" : "Created on"}</dt>
              <dd>
                {formatDate(closed ? listing.closedAt : listing.createdAt)}
              </dd>
            </div>
          </dl>
        )}
        {(statusMutation.error || deleteMutation.error) && (
          <StatusAlert variant="danger" title="Action failed">
            {(statusMutation.error ?? deleteMutation.error).message}
          </StatusAlert>
        )}
      </div>
      <div className="listing-actions">
        <Link
          className="button-secondary"
          to={`/donor/listings/${listing.id}/reservations`}
        >
          History
        </Link>
        {!closed && (
          <Link
            className="button-secondary"
            to={`/donor/listings/${listing.id}/edit`}
          >
            <Pencil size={16} /> Edit
          </Link>
        )}
        <Link
          className="button-secondary"
          to={`/donor/listings/${listing.id}/duplicate`}
        >
          <Copy size={16} /> Duplicate
        </Link>
        {listing.status === DonationStatus.ACTIVE && (
          <button
            disabled={pending}
            onClick={() => changeStatus(DonationStatus.PAUSED)}
          >
            <Pause size={16} /> Pause
          </button>
        )}
        {listing.status === DonationStatus.PAUSED && (
          <button
            disabled={pending || listing.remainingQuantity <= 0}
            onClick={() => changeStatus(DonationStatus.ACTIVE)}
          >
            <Play size={16} /> Resume
          </button>
        )}
        {[DonationStatus.ACTIVE, DonationStatus.PAUSED].includes(
          listing.status,
        ) &&
          (confirming === "cancel" ? (
            <div
              className="inline-confirm"
              role="group"
              aria-label="Confirm listing cancellation"
            >
              <span>Close this listing?</span>
              <button
                className="button-danger"
                onClick={() => changeStatus(DonationStatus.CANCELLED)}
              >
                Confirm
              </button>
              <button onClick={() => setConfirming(null)}>Keep</button>
            </div>
          ) : (
            <button
              className="button-danger-outline"
              disabled={pending}
              onClick={() => setConfirming("cancel")}
            >
              Cancel
            </button>
          ))}
        {listing.revenue <= 0 &&
          (confirming === "delete" ? (
            <div
              className="inline-confirm"
              role="group"
              aria-label="Confirm permanent deletion"
            >
              <span>Delete forever?</span>
              <button
                className="button-danger"
                onClick={() => deleteMutation.mutate(listing.id)}
              >
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={() => setConfirming(null)}>Keep</button>
            </div>
          ) : (
            <button
              className="button-quiet"
              disabled={pending}
              onClick={() => setConfirming("delete")}
            >
              <Trash2 size={16} /> Delete
            </button>
          ))}
        {listing.status === DonationStatus.ACTIVE && (
          <button
            className="button-primary"
            onClick={() =>
              navigate(`/donor/manual-donations?listing=${listing.id}`)
            }
          >
            <HandCoins size={16} /> Give out
          </button>
        )}
      </div>
    </article>
  );
}

export function ListingSection({ title, listings, emptyTitle, emptyCopy }) {
  return (
    <section className="donation-section">
      <h2>{title}</h2>
      {listings.length ? (
        <div className="listing-stack">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="donation-empty">
          <PackageOpen />
          <h3>{emptyTitle}</h3>
          <p>{emptyCopy}</p>
        </div>
      )}
    </section>
  );
}

function BreakdownBars({ title, entries }) {
  const max = Math.max(
    0,
    ...entries.map((entry) => Number(entry.donatedQuantity ?? 0)),
  );
  return (
    <section className="report-breakdown">
      <h3>{title}</h3>
      {entries.length ? (
        entries.map((entry) => (
          <div className="report-bar-row" key={entry.label}>
            <span>{CATEGORY_LABELS[entry.label] ?? entry.label}</span>
            <div className="report-bar">
              <i
                style={{
                  width: `${max ? (entry.donatedQuantity / max) * 100 : 0}%`,
                }}
              />
            </div>
            <strong>{Number(entry.donatedQuantity).toLocaleString()}</strong>
          </div>
        ))
      ) : (
        <p className="muted-text">No breakdown data yet.</p>
      )}
    </section>
  );
}

export function DonationReportPanel() {
  const [period, setPeriod] = useState("all");
  const today = new Date();
  const filters =
    period === "month"
      ? {
          periodStart: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
          periodEnd: today.toISOString().slice(0, 10),
        }
      : {};
  const report = useDonationReport(filters);

  return (
    <aside className="report-panel">
      <div className="report-heading">
        <div>
          <p className="donation-eyebrow">Live overview</p>
          <h2>Statistical Reports</h2>
        </div>
        <select
          aria-label="Report period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="all">All time</option>
          <option value="month">This month</option>
        </select>
      </div>
      {report.isLoading && (
        <StatusAlert variant="loading" title="Loading statistics" />
      )}
      {report.isError && (
        <StatusAlert
          variant="danger"
          title="Unable to load statistics"
          action={<button onClick={() => report.refetch()}>Retry</button>}
        >
          Listings remain available while reports recover.
        </StatusAlert>
      )}
      {report.data && (
        <>
          <div className="report-metrics">
            <div>
              <CalendarDays />
              <span>Collected Donations</span>
              <strong>{report.data.donationCount.toLocaleString()}</strong>
            </div>
            <div>
              <PackageOpen />
              <span>Total Quantity (mixed units)</span>
              <strong>
                {report.data.totalDonatedQuantity.toLocaleString()}
              </strong>
            </div>
            <div>
              <HandCoins />
              <span>Total Revenue</span>
              <strong>{formatVnd(report.data.totalRevenue)}</strong>
            </div>
          </div>
          {report.data.donationCount === 0 &&
          report.data.byCategory.length === 0 ? (
            <div className="donation-empty">
              <h3>No statistical data yet</h3>
              <p>Charts appear after donations are collected.</p>
            </div>
          ) : (
            <>
              <BreakdownBars
                title="Donations by category"
                entries={report.data.byCategory}
              />
              <BreakdownBars
                title="Top measurement units"
                entries={report.data.byMeasurementUnit}
              />
            </>
          )}
          <p className="report-unavailable">
            Revenue over time is not available from the reporting API.
          </p>
        </>
      )}
    </aside>
  );
}
