import { useListings } from '@/features/admin/hooks/useListings.js'
import { Pagination } from '@/shared/components/Pagination.jsx'
import { Card } from '@/shared/components/Card.jsx'
import { formatShortDate, formatVnd } from '@/shared/utils/formatters.js'
import { cn } from '@/shared/utils/cn.js'

// Mirrors the backend's DonationStatus enum (donation/models/Donation.js) --
// there's no shared frontend constant for it yet, unlike ACCOUNT_STATUS/
// USER_ROLES in config/constants.js.
const STATUS_STYLES = {
  Active: 'text-primary',
  Paused: 'text-amber-700',
  Cancelled: 'text-danger',
}

/** Cancel button + its row-scoped error, shared by the table row (desktop)
 * and the card (mobile) below so the two layouts can never drift out of
 * sync with each other. */
function ListingActionButton({ listing, isActing, listingActionError, onCancel }) {
  if (listing.status === 'Cancelled') return null

  return (
    <>
      <button
        type="button"
        disabled={isActing}
        onClick={() => {
          if (window.confirm(`Cancel listing "${listing.name}"?`)) {
            onCancel(listing.id)
          }
        }}
        className="rounded-card bg-danger px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isActing ? 'Cancelling…' : 'Cancel'}
      </button>
      {listingActionError && <p className="mt-1 text-xs text-danger">{listingActionError}</p>}
    </>
  )
}

/** Listing Moderation page (SRS 7.3.1/7.3.2). Cancel calls straight into
 * useListings's handleCancel -- window.confirm is enough of a safety check
 * here, same as UserManagementPage's Deactivate/Reactivate.
 *
 * Below the `sm` breakpoint the table is replaced with a stacked card per
 * listing (SRS A.3.c) instead of just letting the table scroll horizontally
 * -- a scrollable table keeps the same row/column structure on a phone, which
 * doesn't count as responsive; a card reflows each listing's fields into a
 * single-column layout that actually fits the screen. */
export function ListingModerationPage() {
  const {
    listings,
    loading,
    error,
    search,
    currentPage,
    totalPages,
    goToPage,
    actingListingIds,
    listingActionErrors,
    handleCancel,
    setSearch,
  } = useListings()

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">Listing Moderation Dashboard</h1>
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

      {loading ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-danger">Couldn't load listings.</p>
      ) : listings.length === 0 ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-muted">No listings found.</p>
      ) : (
        <>
          {/* Desktop/tablet: full table, sm breakpoint and up. */}
          <div className="mt-6 hidden overflow-x-auto rounded-card sm:block">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Listing ID</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Donor</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Food Name</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Category</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Qty</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Price</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Posted</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Status</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing, index) => (
                  <tr key={listing.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.id}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.donorName ?? '—'}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.name}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.foodCategory}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.remainingQuantity}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{listing.price ? formatVnd(listing.price) : 'Free'}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{formatShortDate(listing.createdAt)}</td>
                    <td className={cn('px-3 py-2 sm:px-4 sm:py-3 font-semibold', STATUS_STYLES[listing.status] ?? 'text-ink')}>
                      {listing.status}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <ListingActionButton
                        listing={listing}
                        isActing={actingListingIds.has(listing.id)}
                        listingActionError={listingActionErrors[listing.id]}
                        onCancel={handleCancel}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: one card per listing, below the sm breakpoint. */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {listings.map((listing) => (
              <Card key={listing.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{listing.name}</p>
                    <p className="text-sm text-muted">{listing.donorName ?? '—'}</p>
                  </div>
                  <span className={cn('text-sm font-semibold', STATUS_STYLES[listing.status] ?? 'text-ink')}>
                    {listing.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Listing ID</dt>
                    <dd className="text-ink">{listing.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Category</dt>
                    <dd className="text-ink">{listing.foodCategory}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Qty</dt>
                    <dd className="text-ink">{listing.remainingQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Price</dt>
                    <dd className="text-ink">{listing.price ? formatVnd(listing.price) : 'Free'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Posted</dt>
                    <dd className="text-ink">{formatShortDate(listing.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <ListingActionButton
                    listing={listing}
                    isActing={actingListingIds.has(listing.id)}
                    listingActionError={listingActionErrors[listing.id]}
                    onCancel={handleCancel}
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  )
}
