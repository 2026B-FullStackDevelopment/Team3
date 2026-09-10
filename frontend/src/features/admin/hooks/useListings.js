import { useCallback, useEffect, useState } from 'react'
import { donationService } from '@/features/admin/services/donationService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * Listing Moderation data hook (SRS 7.3.1/7.3.2). Fetches listings on mount
 * and whenever search or page changes. Read/filter state only — cancel
 * lives on a later branch. Only a search box exists in the design (no
 * status/role dropdowns for this view), so that's the only filter here.
 */
export function useListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setError(result.error)
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
  }
}
