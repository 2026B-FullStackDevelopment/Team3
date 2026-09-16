import { useAuditLog } from '@/features/admin/hooks/useAuditLog.js'
import { Pagination } from '@/shared/components/Pagination.jsx'
import { cn } from '@/shared/utils/cn.js'

const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Finalized', label: 'Finalised' },
  { value: 'Undone', label: 'Undone' },
]

// Mirrors the backend's AdminActionType enum (admin/models/AuditLog.js) --
// there's no shared frontend constant for this yet.
const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'Action Type' },
  { value: 'DeactivateUser', label: 'Deactivate User' },
  { value: 'ReactivateUser', label: 'Reactivate User' },
  { value: 'CancelDonation', label: 'Cancel Donation' },
]

// The backend's status enum spells it "Finalized"; the design's copy is
// "Finalised" (British spelling). Display-only, same as the Deactivated ->
// "Inactive" mapping on the User Management page.
const STATUS_DISPLAY = {
  Pending: 'Pending',
  Finalized: 'Finalised',
  Undone: 'Undone',
}

const STATUS_STYLES = {
  Pending: 'text-amber-700',
  Finalized: 'text-muted',
  Undone: 'text-blue-600',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

/** "2026-08-05T14:32:00Z" -> "Aug 5, 2026 - 14:32". Local to this page --
 * shared/utils/formatters.js's formatShortDate has no year or time component. */
function formatLogTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  return `${dateFormatter.format(date)} - ${timeFormatter.format(date)}`
}

/** Audit Log page (SRS §8). Undo calls straight into useAuditLog's
 * handleUndo -- window.confirm is enough of a safety check here, same as
 * the Deactivate/Reactivate/Cancel buttons elsewhere in Admin. Expired is
 * never triggered from here -- that transition is the backend's scheduled
 * sweep's job, not a user action. */
export function AuditLogPage() {
  const {
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
    actingLogIds,
    logActionErrors,
    handleUndo,
  } = useAuditLog()

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">Audit Log</h1>
      <p className="mt-1 text-muted">Review admin activity and undo recent actions within the allowed time window.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by Admin Username, Target ID, or Action Type..."
          className="w-full rounded-card bg-surface px-4 py-2 text-ink placeholder:text-muted sm:min-w-64 sm:flex-1"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-card bg-surface px-4 py-2 text-ink sm:w-auto"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={actionTypeFilter}
          onChange={(event) => setActionTypeFilter(event.target.value)}
          className="w-full rounded-card bg-surface px-4 py-2 text-ink sm:w-auto"
        >
          {ACTION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card">
        <table className="w-full text-left text-sm sm:text-base">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Log ID</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Admin</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Action</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Target</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Status</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Timestamp</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Undo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="bg-surface px-4 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="bg-surface px-4 py-6 text-center text-danger">
                  Couldn't load audit logs.
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="bg-surface px-4 py-6 text-center text-muted">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{entry.id}</td>
                  {/* Admin has no username field at all (only email) -- see
                      SESSION_NOTES.md for why this joins to email, not a
                      fabricated display name. */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{entry.adminEmail ?? entry.adminId}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{ACTION_TYPE_OPTIONS.find((o) => o.value === entry.action)?.label ?? entry.action}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">
                    {entry.targetType}: {entry.targetId}
                  </td>
                  <td className={cn('px-3 py-2 sm:px-4 sm:py-3 font-semibold', STATUS_STYLES[entry.status] ?? 'text-ink')}>
                    {STATUS_DISPLAY[entry.status] ?? entry.status}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{formatLogTimestamp(entry.createdAt)}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    {entry.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          disabled={actingLogIds.has(entry.id)}
                          onClick={() => {
                            if (window.confirm('Undo this action?')) {
                              handleUndo(entry)
                            }
                          }}
                          className="rounded-card bg-amber-600 px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingLogIds.has(entry.id) ? 'Undoing…' : 'Undo'}
                        </button>
                        {logActionErrors[entry.id] && (
                          <p className="mt-1 text-xs text-danger">{logActionErrors[entry.id]}</p>
                        )}
                      </>
                    ) : entry.status === 'Undone' ? (
                      <span className="text-blue-600">Already Undone</span>
                    ) : (
                      <span className="text-muted">Expired</span>
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
