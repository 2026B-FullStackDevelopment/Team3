import { useCallback, useEffect, useState } from 'react'
import { accountService } from '@/features/admin/services/accountService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * User Management data hook (SRS 7.1.1). Fetches accounts on mount and
 * whenever a filter or page changes. Read/filter state only — deactivate/
 * reactivate live on a later branch.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilterState] = useState('')
  const [roleFilter, setRoleFilterState] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Only feed the query a search term once typing pauses. The reset to
  // page 1 happens in the same timeout callback as the debounced value
  // itself, so both updates land in one batched re-render — the fetch
  // effect below never fires once with a stale page and a new search.
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

  const setRoleFilter = useCallback((value) => {
    setRoleFilterState(value)
    setCurrentPage(1)
  }, [])

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await accountService.getAccounts({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    if (result.ok) {
      setAccounts(result.data?.accounts ?? [])
      const total = result.data?.total ?? 0
      const limit = result.data?.limit ?? PAGE_SIZE
      setTotalPages(Math.max(1, Math.ceil(total / limit)))
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter, roleFilter, currentPage])

  useEffect(() => {
    // This is the standard "fetch on mount and on dep change" effect (the
    // same shape as react.dev's own data-fetching example) -- setLoading(true)
    // runs synchronously as fetchAccounts starts, which is exactly what
    // react-hooks/set-state-in-effect's own message calls a legitimate
    // "subscribe and set state in a callback" case, not the derived-state
    // antipattern the rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts()
  }, [fetchAccounts])

  const goToPage = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  return {
    accounts,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    currentPage,
    totalPages,
    goToPage,
    refetch: fetchAccounts,
  }
}
