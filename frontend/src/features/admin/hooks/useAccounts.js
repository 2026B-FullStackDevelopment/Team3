import { useCallback, useEffect, useState } from 'react'
import { accountService } from '@/features/admin/services/accountService.js'

const SEARCH_DEBOUNCE_MS = 350
const PAGE_SIZE = 10

/**
 * User Management data hook (SRS 7.1.1). Fetches accounts on mount and
 * whenever a filter or page changes, plus the deactivate/reactivate
 * mutations themselves.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-row action state, not global — clicking one row's button shouldn't
  // disable or spinner every other row's button.
  const [actingAccountIds, setActingAccountIds] = useState(() => new Set())
  const [accountActionErrors, setAccountActionErrors] = useState({})

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
      // httpClient's error is never a bare string -- it's the backend's
      // { error, message } body, a raw Error on a network failure, or null
      // when there's no body at all. Read .message, same as identityHook.js.
      setError(result.error?.message || 'Something went wrong. Please try again.')
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

  const setRowActing = useCallback((accountId, isActing) => {
    setActingAccountIds((prev) => {
      const next = new Set(prev)
      if (isActing) next.add(accountId)
      else next.delete(accountId)
      return next
    })
  }, [])

  const clearActionError = useCallback((accountId) => {
    setAccountActionErrors((prev) => {
      if (!(accountId in prev)) return prev
      return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== accountId))
    })
  }, [])

  // Deactivate/reactivate take effect immediately (no limbo/undo-window
  // state like a cancelled listing), so the server's response already IS
  // the row's new truth — replacing that one row with it is simpler than a
  // full refetch and can't leave the table showing a stale status.
  const runAccountAction = useCallback(
    async (accountId, action) => {
      setRowActing(accountId, true)
      clearActionError(accountId)
      const result = await action(accountId)
      if (result.ok) {
        setAccounts((prev) => prev.map((account) => (account.id === accountId ? result.data : account)))
      } else {
        setAccountActionErrors((prev) => ({
          ...prev,
          [accountId]: result.error?.message || 'Something went wrong. Please try again.',
        }))
      }
      setRowActing(accountId, false)
    },
    [clearActionError, setRowActing],
  )

  const handleDeactivate = useCallback(
    (accountId) => runAccountAction(accountId, accountService.deactivateAccount),
    [runAccountAction],
  )
  const handleReactivate = useCallback(
    (accountId) => runAccountAction(accountId, accountService.reactivateAccount),
    [runAccountAction],
  )

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
    actingAccountIds,
    accountActionErrors,
    handleDeactivate,
    handleReactivate,
  }
}
