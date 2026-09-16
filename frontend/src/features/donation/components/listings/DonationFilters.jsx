import { CATEGORY_LABELS } from "@/features/donation/models/donation.js";

export function DonationFilters({
  dateRangeInvalid,
  filters,
  onChange,
  onClear,
}) {
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
      <label className="donation-filter-date">
        <span>Created from</span>
        <input
          type="date"
          value={filters.createdFrom}
          onChange={(event) =>
            onChange({ ...filters, createdFrom: event.target.value })
          }
        />
      </label>
      <label className="donation-filter-date">
        <span>Created to</span>
        <input
          type="date"
          value={filters.createdTo}
          onChange={(event) =>
            onChange({ ...filters, createdTo: event.target.value })
          }
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
      {dateRangeInvalid && (
        <p className="donation-filter-error" role="alert">
          Created from cannot be after Created to.
        </p>
      )}
    </div>
  );
}
