import { useListings } from '@/features/admin/hooks/useListings.js'
import { Pagination } from '@/shared/components/Pagination.jsx'
import { formatShortDate, formatVND } from '@/shared/utils/format.js'
import { cn } from '@/shared/utils/cn.js'

// Mirrors the backend's DonationStatus enum (donation/models/Donation.js) --
// there's no shared frontend constant for it yet, unlike ACCOUNT_STATUS/
// USER_ROLES in config/constants.js.
const STATUS_STYLES = {
  Active: 'text-primary',
  Paused: 'text-amber-700',
  Cancelled: 'text-danger',
}

/** Listing Moderation page (SRS 7.3.1/7.3.2). Query/search UI only -- the
 * Cancel button renders but does nothing yet. */
export function ListingModerationPage() {
  const { listings, loading, error, search, setSearch, currentPage, totalPages, goToPage } = useListings()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Listing Moderation Dashboard</h1>
      <p className="mt-1 text-muted">Review and manage food listings posted by donors.</p>

      <div className="mt-6">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by Donor Name, Donor ID, or Donation ID..."
          className="w-full max-w-md rounded-card bg-surface px-4 py-2 text-ink placeholder:text-muted"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-card">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-4 py-3 font-semibold">Listing ID</th>
              <th className="px-4 py-3 font-semibold">Donor</th>
              <th className="px-4 py-3 font-semibold">Food Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Posted</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="bg-surface px-4 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="bg-surface px-4 py-6 text-center text-danger">
                  Couldn't load listings.
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={9} className="bg-surface px-4 py-6 text-center text-muted">
                  No listings found.
                </td>
              </tr>
            ) : (
              listings.map((listing, index) => (
                <tr key={listing.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                  <td className="px-4 py-3 text-ink">{listing.id}</td>
                  <td className="px-4 py-3 text-ink">{listing.donorName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink">{listing.name}</td>
                  <td className="px-4 py-3 text-ink">{listing.foodCategory}</td>
                  <td className="px-4 py-3 text-ink">{listing.remainingQuantity}</td>
                  <td className="px-4 py-3 text-ink">{listing.price ? formatVND(listing.price) : 'Free'}</td>
                  <td className="px-4 py-3 text-ink">{formatShortDate(listing.createdAt)}</td>
                  <td className={cn('px-4 py-3 font-semibold', STATUS_STYLES[listing.status] ?? 'text-ink')}>
                    {listing.status}
                  </td>
                  <td className="px-4 py-3">
                    {listing.status !== 'Cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          // Wired up once listing mutation endpoints are in scope.
                        }}
                        className="rounded-card bg-danger px-4 py-1.5 text-sm font-medium text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  )
}
