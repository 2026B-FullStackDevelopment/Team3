import { useCallback, useEffect, useState } from 'react'
import { auditLogService } from '@/features/admin/services/auditLogService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * Audit Log data hook (SRS §8). Fetches entries on mount and whenever a
 * filter or page changes. Read/filter state only — undo lives on a later
 * branch.
 */
export function useAuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilterState] = useState('')
  const [actionTypeFilter, setActionTypeFilterState] = useState('')

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

  // Dropdown filters reset the page the same way: batched with the filter
  // change itself, not via a separate effect watching for it.
  const setStatusFilter = useCallback((value) => {
    setStatusFilterState(value)
    setCurrentPage(1)
  }, [])

  const setActionTypeFilter = useCallback((value) => {
    setActionTypeFilterState(value)
    setCurrentPage(1)
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await auditLogService.getAuditLogs({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      actionType: actionTypeFilter || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    if (result.ok) {
      setEntries(result.data?.entries ?? [])
      const total = result.data?.total ?? 0
      const limit = result.data?.limit ?? PAGE_SIZE
      setTotalPages(Math.max(1, Math.ceil(total / limit)))
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter, actionTypeFilter, currentPage])

  useEffect(() => {
    // See useAccounts.js for why this line is exempted: standard
    // fetch-on-mount-and-dep-change effect, matching react.dev's own
    // data-fetching example.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const goToPage = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  return {
    entries,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    actionTypeFilter,
    setActionTypeFilter,
    currentPage,
    totalPages,
    goToPage,
    refetch: fetchAuditLogs,
  }
}
