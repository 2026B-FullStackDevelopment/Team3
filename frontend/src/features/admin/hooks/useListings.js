import { useCallback, useEffect, useState } from 'react'
import { donationService } from '@/features/admin/services/donationService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * Listing Moderation data hook (SRS 7.3.1/7.3.2). Fetches listings on mount
 * and whenever search or page changes, plus the cancel mutation itself.
 * Only a search box exists in the design (no status/role dropdowns for this
 * view), so that's the only filter here.
 */
export function useListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-row action state, not global — clicking one row's Cancel shouldn't
  // disable or spinner every other row's button.
  const [actingListingIds, setActingListingIds] = useState(() => new Set())
  const [listingActionErrors, setListingActionErrors] = useState({})

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Reset to page 1 in the same timeout callback that commits the
  // debounced search term, so both land in one batched re-render.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [search])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await donationService.getListings({
      search: debouncedSearch || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    if (result.ok) {
      setListings(result.data?.listings ?? [])
      const total = result.data?.total ?? 0
      const limit = result.data?.limit ?? PAGE_SIZE
      setTotalPages(Math.max(1, Math.ceil(total / limit)))
    } else {
      // See useAccounts.js: result.error is the backend's { error, message }
      // body (or a raw Error/null), never a bare string -- read .message.
      setError(result.error?.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }, [debouncedSearch, currentPage])

  useEffect(() => {
    // See useAccounts.js for why this line is exempted: standard
    // fetch-on-mount-and-dep-change effect, matching react.dev's own
    // data-fetching example.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings()
  }, [fetchListings])

  const goToPage = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const setRowActing = useCallback((listingId, isActing) => {
    setActingListingIds((prev) => {
      const next = new Set(prev)
      if (isActing) next.add(listingId)
      else next.delete(listingId)
      return next
    })
  }, [])

  const clearActionError = useCallback((listingId) => {
    setListingActionErrors((prev) => {
      if (!(listingId in prev)) return prev
      return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== listingId))
    })
  }, [])

  // Unlike a deactivated/reactivated account, a cancelled listing doesn't
  // land on "Cancelled" right away -- adminCancelDonation only puts it in
  // PendingCancellation limbo, and this same query already filters to
  // status: Active. So the correct result of a successful cancel is that
  // the row disappears from this table, not that it gets relabelled --
  // a refetch gets that right for free, where patching the row to a
  // hardcoded "Cancelled" locally would show a status that isn't true yet.
  const handleCancel = useCallback(
    async (listingId) => {
      setRowActing(listingId, true)
      clearActionError(listingId)
      const result = await donationService.cancelListing(listingId)
      if (result.ok) {
        await fetchListings()
      } else {
        setListingActionErrors((prev) => ({
          ...prev,
          [listingId]: result.error?.message || 'Something went wrong. Please try again.',
        }))
      }
      setRowActing(listingId, false)
    },
    [clearActionError, setRowActing, fetchListings],
  )

  return {
    listings,
    loading,
    error,
    search,
    setSearch,
    currentPage,
    totalPages,
    goToPage,
    refetch: fetchListings,
    actingListingIds,
    listingActionErrors,
    handleCancel,
  }
}
