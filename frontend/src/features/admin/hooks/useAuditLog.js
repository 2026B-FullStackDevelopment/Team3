import { useCallback, useEffect, useState } from 'react'
import { auditLogService } from '@/features/admin/services/auditLogService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * Audit Log data hook (SRS §8). Fetches entries on mount and whenever a
 * filter or page changes, plus the undo mutation itself. The Pending ->
 * Finalized transition is never computed here -- that's the backend's
 * scheduled sweep's job; this hook just reflects whatever status the API
 * returns on each fetch.
 */
export function useAuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-row action state, not global — clicking one row's Undo shouldn't
  // disable or spinner every other row's button.
  const [actingLogIds, setActingLogIds] = useState(() => new Set())
  const [logActionErrors, setLogActionErrors] = useState({})

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
      // See useAccounts.js: result.error is the backend's { error, message }
      // body (or a raw Error/null), never a bare string -- read .message.
      setError(result.error?.message || 'Something went wrong. Please try again.')
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

  const setRowActing = useCallback((logId, isActing) => {
    setActingLogIds((prev) => {
      const next = new Set(prev)
      if (isActing) next.add(logId)
      else next.delete(logId)
      return next
    })
  }, [])

  const clearActionError = useCallback((logId) => {
    setLogActionErrors((prev) => {
      if (!(logId in prev)) return prev
      return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== logId))
    })
  }, [])

  // auditLogService.undoAuditLogEntry's two branches return different
  // shapes (an updated Account vs an updated AuditLog entry), so this only
  // ever patches the one field every caller actually needs -- the row's own
  // status -- instead of trying to reconcile those. Nothing here is
  // computed from undoDeadline/elapsed time; it's a direct reflection of
  // the undo call that just succeeded, same as the Deactivate/Reactivate
  // row patch in useAccounts.js.
  const handleUndo = useCallback(
    async (logEntry) => {
      const logId = logEntry.id
      setRowActing(logId, true)
      clearActionError(logId)
      const result = await auditLogService.undoAuditLogEntry(logEntry)
      if (result.ok) {
        setEntries((prev) => prev.map((entry) => (entry.id === logId ? { ...entry, status: 'Undone' } : entry)))
      } else {
        setLogActionErrors((prev) => ({
          ...prev,
          [logId]: result.error?.message || 'Something went wrong. Please try again.',
        }))
      }
      setRowActing(logId, false)
    },
    [clearActionError, setRowActing],
  )

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
    actingLogIds,
    logActionErrors,
    handleUndo,
  }
}
