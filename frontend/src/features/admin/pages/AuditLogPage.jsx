import { useAuditLog } from '@/features/admin/hooks/useAuditLog.js'
import { Pagination } from '@/shared/components/Pagination.jsx'
import { Card } from '@/shared/components/Card.jsx'
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

/** Target column display -- name alongside id so an admin doesn't have to
 * cross-reference a bare uuid. A Donation target reads "Donated by" (the
 * donor's company name) since the donation itself is what's being acted on,
 * not the donor account; a User target keeps the plain "User" label. */
function formatTarget(entry) {
  const name = entry.targetName ?? '—'
  if (entry.targetType === 'Donation') {
    return `Donated by: ${name} | ID: ${entry.targetId}`
  }
  return `User: ${name} | ID: ${entry.targetId}`
}

/** Undo button (or its Undone/Expired/— placeholder), shared by the table
 * row (desktop) and the card (mobile) below so the two layouts can never
 * drift out of sync with each other. */
function AuditLogUndoCell({ entry, isActing, logActionError, onUndo }) {
  if (entry.status === 'Pending') {
    return (
      <>
        <button
          type="button"
          disabled={isActing}
          onClick={() => {
            if (window.confirm('Undo this action?')) {
              onUndo(entry)
            }
          }}
          className="rounded-card bg-amber-600 px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isActing ? 'Undoing…' : 'Undo'}
        </button>
        {logActionError && <p className="mt-1 text-xs text-danger">{logActionError}</p>}
      </>
    )
  }
  if (entry.status === 'Undone') return <span className="text-blue-600">Already Undone</span>
  if (entry.undoDeadline) return <span className="text-muted">Expired</span>
  return <span className="text-muted">—</span>
}

/** Audit Log page (SRS §8). Undo calls straight into useAuditLog's
 * handleUndo -- window.confirm is enough of a safety check here, same as
 * the Deactivate/Reactivate/Cancel buttons elsewhere in Admin. Expired is
 * never triggered from here -- that transition is the backend's scheduled
 * sweep's job, not a user action.
 *
 * Below the `sm` breakpoint the table is replaced with a stacked card per
 * entry (SRS A.3.c) instead of just letting the table scroll horizontally
 * -- a scrollable table keeps the same row/column structure on a phone, which
 * doesn't count as responsive; a card reflows each entry's fields into a
 * single-column layout that actually fits the screen. */
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
          placeholder="Search by Admin Email..."
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

      {loading ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-danger">Couldn't load audit logs.</p>
      ) : entries.length === 0 ? (
        <p className="mt-6 rounded-card bg-surface px-4 py-6 text-center text-muted">No audit log entries found.</p>
      ) : (
        <>
          {/* Desktop/tablet: full table, sm breakpoint and up. */}
          <div className="mt-6 hidden overflow-x-auto rounded-card sm:block">
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
                {entries.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{entry.id}</td>
                    {/* Admin has no username field at all (only email) -- see
                        SESSION_NOTES.md for why this joins to email, not a
                        fabricated display name. */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{entry.adminEmail ?? entry.adminId}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{ACTION_TYPE_OPTIONS.find((o) => o.value === entry.action)?.label ?? entry.action}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{formatTarget(entry)}</td>
                    <td className={cn('px-3 py-2 sm:px-4 sm:py-3 font-semibold', STATUS_STYLES[entry.status] ?? 'text-ink')}>
                      {STATUS_DISPLAY[entry.status] ?? entry.status}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{formatLogTimestamp(entry.createdAt)}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <AuditLogUndoCell
                        entry={entry}
                        isActing={actingLogIds.has(entry.id)}
                        logActionError={logActionErrors[entry.id]}
                        onUndo={handleUndo}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: one card per entry, below the sm breakpoint. */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {ACTION_TYPE_OPTIONS.find((o) => o.value === entry.action)?.label ?? entry.action}
                    </p>
                    <p className="text-sm text-muted">{entry.adminEmail ?? entry.adminId}</p>
                  </div>
                  <span className={cn('text-sm font-semibold', STATUS_STYLES[entry.status] ?? 'text-ink')}>
                    {STATUS_DISPLAY[entry.status] ?? entry.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Log ID</dt>
                    <dd className="text-ink">{entry.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Target</dt>
                    <dd className="text-ink">{formatTarget(entry)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Timestamp</dt>
                    <dd className="text-ink">{formatLogTimestamp(entry.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <AuditLogUndoCell
                    entry={entry}
                    isActing={actingLogIds.has(entry.id)}
                    logActionError={logActionErrors[entry.id]}
                    onUndo={handleUndo}
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
